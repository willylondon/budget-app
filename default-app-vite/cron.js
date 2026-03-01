import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { scrapeCustomsPortal } from './scripts/scraper.js';

// --- Supabase client for the backend (uses service_role for full access) ---
const supabaseUrl = process.env.SUPABASE_URL || 'https://uevbdgcgrobhvcsrpfdg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
    console.error('FATAL: SUPABASE_SERVICE_ROLE_KEY env var is not set. Run with:');
    console.error('  SUPABASE_SERVICE_ROLE_KEY="eyJ..." node cron.js');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚢 BrokerTrack Background Service started.');
console.log('   Scraping active shipments every 10 minutes...');

// Run immediately on startup, then every 10 minutes
runScrapeJob();
cron.schedule('*/10 * * * *', runScrapeJob);

async function runScrapeJob() {
    console.log(`\n[${new Date().toLocaleTimeString()}] 🔍 Checking for pending declarations...`);

    try {
        // 1. Fetch all active/pending shipments from the database
        const { data: shipments, error } = await supabase
            .from('shipments')
            .select('*')
            .in('status', ['Pending', 'Assessment', 'Assessing']);

        if (error) {
            console.error('  ❌ Error fetching shipments:', error.message);
            return;
        }

        if (!shipments || shipments.length === 0) {
            console.log('  ℹ️  No pending shipments to track.');
            return;
        }

        console.log(`  📦 Found ${shipments.length} shipment(s) to scrape.`);

        // 2. Process each shipment sequentially
        for (const shipment of shipments) {
            console.log(`\n  → Scraping: ${shipment.commercial_reference} (Office: ${shipment.office_code})`);

            const result = await scrapeCustomsPortal(
                shipment.office_code,
                shipment.year,
                shipment.commercial_reference,
                shipment.trn,
                shipment.tracking_role === 'Importer'
            );

            if (result.success && result.data) {
                // 3. Update the shipment record
                const { error: updateError } = await supabase
                    .from('shipments')
                    .update({
                        status: result.data.status,
                        customs_reference: result.data.customsReference,
                        last_scraped_at: new Date().toISOString(),
                    })
                    .eq('id', shipment.id);

                if (updateError) {
                    console.error(`    ❌ DB update failed: ${updateError.message}`);
                    continue;
                }

                // 4. Insert status history entries for each assigned unit
                if (result.data.assignedUnits && result.data.assignedUnits.length > 0) {
                    for (const unit of result.data.assignedUnits) {
                        // Upsert — avoid duplicating the same unit entry
                        await supabase.from('shipment_statuses').upsert(
                            {
                                shipment_id: shipment.id,
                                status_type: unit.unit,
                                status_value: unit.status || 'Pending',
                                date_time_assigned: unit.dateAssigned ? new Date(unit.dateAssigned).toISOString() : null,
                                date_time_completed: unit.dateCompleted ? new Date(unit.dateCompleted).toISOString() : null,
                            },
                            { onConflict: 'shipment_id,status_type' }
                        );
                    }
                }

                // 5. Insert high-level statuses (Customs Release, Exit Note, Lane Assigned)
                const topLevelStatuses = [
                    { type: 'Customs Release', value: result.data.customsRelease },
                    { type: 'Exit Note', value: result.data.exitNote },
                    { type: 'Lane Assigned', value: result.data.laneAssigned },
                ];

                for (const s of topLevelStatuses) {
                    if (s.value) {
                        await supabase.from('shipment_statuses').upsert(
                            {
                                shipment_id: shipment.id,
                                status_type: s.type,
                                status_value: s.value,
                            },
                            { onConflict: 'shipment_id,status_type' }
                        );
                    }
                }

                console.log(`    ✅ Updated: ${shipment.commercial_reference} → ${result.data.status}`);
            } else {
                console.error(`    ⚠️  Scrape failed: ${result.error}`);
            }
        }

        console.log(`\n[${new Date().toLocaleTimeString()}] ✅ Scrape cycle complete.`);
    } catch (err) {
        console.error('  💥 Unexpected error:', err.message);
    }
}
