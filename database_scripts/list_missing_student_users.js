import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdczoqsbwvittzaqvorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3pvcXNid3ZpdHR6YXF2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQ0NjAsImV4cCI6MjA4NjEwMDQ2MH0.fPxYv0DufwDmr9G5v-ThfeWSuLigf-oHiL5MNIy-mCU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeStudents() {
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
    
    console.log(`Total students in database: ${students.length}`);
    console.log(`Total existing profiles (users): ${existingEmails.size}`);

    const missing = [];
    for (const student of students) {
        const email = student.email?.toLowerCase().trim();
        if (email) {
            if (!existingEmails.has(email)) {
                missing.push(student);
            }
        }
    }

    console.log(`Students with emails but NO user profile: ${missing.length}`);
    missing.forEach(s => {
        console.log(`- ${s.name} (${s.email})`);
    });
}

analyzeStudents();
