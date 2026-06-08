import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdczoqsbwvittzaqvorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3pvcXNid3ZpdHR6YXF2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQ0NjAsImV4cCI6MjA4NjEwMDQ2MH0.fPxYv0DufwDmr9G5v-ThfeWSuLigf-oHiL5MNIy-mCU';

// We disable persistSession so that running the signups doesn't log the script in as the new users
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function createUsers() {
    console.log('Fetching students...');
    const { data: students, error: studentsError } = await supabase.from('students').select('*');
    if (studentsError) {
        console.error('Error fetching students:', studentsError);
        return;
    }

    console.log('Fetching existing profiles...');
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('email');
    if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
    }

    const existingEmails = new Set((profiles || []).map(p => p.email?.toLowerCase().trim()).filter(Boolean));
    
    // Filter students with email who don't have a profile yet
    const toCreate = students.filter(student => {
        const email = student.email?.toLowerCase().trim();
        return email && email.includes('@') && !existingEmails.has(email);
    });

    console.log(`Found ${toCreate.length} students to create users for.`);

    if (toCreate.length === 0) {
        console.log('No users need to be created.');
        return;
    }

    const defaultPassword = 'emcn#2026';

    for (let i = 0; i < toCreate.length; i++) {
        const student = toCreate[i];
        console.log(`[${i + 1}/${toCreate.length}] Creating user for ${student.name} (${student.email})...`);
        
        try {
            // Sign up user via Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: student.email.trim(),
                password: defaultPassword,
                options: {
                    data: {
                        name: student.name,
                        role: 'STUDENT',
                        status: 'ACTIVE'
                    }
                }
            });

            if (authError) {
                console.error(`  Error creating auth user for ${student.name}:`, authError.message);
                if (authError.message.toLowerCase().includes('rate limit') || authError.status === 429) {
                    console.log('  Rate limit hit! Stopping script execution.');
                    break;
                }
            } else if (authData.user) {
                console.log(`  Auth user created successfully! ID: ${authData.user.id}`);
                
                // Explicitly sync the profile table with the student details linked to the new Auth ID
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        name: student.name,
                        role: 'STUDENT',
                        status: 'ACTIVE'
                    })
                    .eq('id', authData.user.id);

                if (profileError) {
                    console.error(`  Error syncing profile table for ${student.name}:`, profileError.message);
                } else {
                    console.log(`  Profile synced successfully!`);
                }
            }
        } catch (err) {
            console.error(`  Unexpected error for ${student.name}:`, err);
        }

        // Delay between registrations to minimize hitting rate limits
        console.log('  Waiting 2.5 seconds before next registration...');
        await sleep(2500);
    }

    console.log('Done!');
}

createUsers();
