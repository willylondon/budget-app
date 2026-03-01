import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://uevbdgcgrobhvcsrpfdg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldmJkZ2Nncm9iaHZjc3JwZmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMyMTkzNCwiZXhwIjoyMDg3ODk3OTM0fQ.aU72jW-bSXpDL2sVOcCQqHC8T_WytP7Kik_V_yeqMAE'
);

async function main() {
    // 1. List all users to find the admin
    const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) { console.error('List error:', listErr); return; }

    console.log('All users:');
    for (const u of users) {
        console.log(`  ${u.email} | confirmed: ${u.email_confirmed_at ? 'YES' : 'NO'} | id: ${u.id}`);
    }

    // 2. Find admin user
    const adminUser = users.find(u => u.email === 'admin@brokertrack.com');
    if (adminUser) {
        // Update to confirm email and reset password
        const { data, error } = await supabase.auth.admin.updateUserById(adminUser.id, {
            email_confirm: true,
            password: 'AdminPass123!',
        });
        if (error) console.error('Update admin error:', error);
        else console.log('Admin user updated and confirmed!');

        // Check if profile exists
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', adminUser.id).single();
        if (!profile) {
            const { error: pErr } = await supabase.from('profiles').insert({
                id: adminUser.id,
                role: 'Admin',
                company_name: 'JA Customs Broker',
            });
            if (pErr) console.error('Profile insert error:', pErr);
            else console.log('Admin profile created!');
        } else {
            console.log('Admin profile already exists:', profile.company_name);
        }
    } else {
        console.log('Admin user not found, creating...');
        const { data, error } = await supabase.auth.admin.createUser({
            email: 'admin@brokertrack.com',
            password: 'AdminPass123!',
            email_confirm: true,
        });
        if (error) console.error('Create error:', error);
        else {
            console.log('Admin created:', data.user.id);
            await supabase.from('profiles').insert({
                id: data.user.id,
                role: 'Admin',
                company_name: 'JA Customs Broker',
            });
            console.log('Admin profile created!');
        }
    }

    // 3. Find importer user and create test shipment if needed
    const importerUser = users.find(u => u.email === 'client@odpem.com');
    if (importerUser) {
        const { data: shipments } = await supabase.from('shipments').select('*').eq('importer_id', importerUser.id);
        if (!shipments || shipments.length === 0) {
            const { error } = await supabase.from('shipments').insert({
                importer_id: importerUser.id,
                office_code: 'JMKCT',
                year: '2026',
                commercial_reference: 'CBJ286',
                trn: '1203709130000',
                tracking_role: 'Declarant',
                status: 'Pending',
            });
            if (error) console.error('Shipment insert:', error);
            else console.log('Test shipment created for importer');
        } else {
            console.log(`Importer already has ${shipments.length} shipment(s)`);
        }
    }

    console.log('\n--- Test Accounts ---');
    console.log('Admin:    admin@brokertrack.com / AdminPass123!');
    console.log('Importer: client@odpem.com / ClientPass123!');
}

main().catch(console.error);
