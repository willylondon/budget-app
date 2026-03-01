import { createClient } from '@supabase/supabase-js';

// We can read env vars from the .env file in the frontend folder if needed, 
// but we might need dotenv to load it since we're running via node.
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.log('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function test() {
    const { data: profiles } = await supabase.from('profiles').select('id').eq('role', 'Importer').limit(1);
    if (!profiles || profiles.length === 0) {
        console.log('No importer profile found to attach shipments to.');
        return;
    }
    const importer_id = profiles[0].id;

    const t = new Date();

    const { data: s3 } = await supabase.from('shipments').insert({
        office_code: 'JMKCT',
        year: '2026',
        commercial_reference: 'MOCK-ALERTS',
        tracking_role: 'Broker',
        trn: '123',
        status: 'Queried',
        customs_reference: 'CUST-3',
        importer_id
    }).select().single();

    if (s3) {
        await supabase.from('shipment_statuses').insert([
            { shipment_id: s3.id, status_type: 'Valuation Branch', status_value: 'Query' },
            { shipment_id: s3.id, status_type: 'RMU', status_value: 'Pending' },
            { shipment_id: s3.id, status_type: 'ATTR:DATE:RMU', status_value: new Date(t.getTime() - 5 * 60 * 60 * 1000).toISOString() }
        ]);
        console.log('Inserted mock data!');
    }
}

test();
