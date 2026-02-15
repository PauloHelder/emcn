
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdczoqsbwvittzaqvorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3pvcXNid3ZpdHR6YXF2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQ0NjAsImV4cCI6MjA4NjEwMDQ2MH0.fPxYv0DufwDmr9G5v-ThfeWSuLigf-oHiL5MNIy-mCU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClasses() {
    console.log('--- Checking Classes ---');
    const { data: classes, error } = await supabase.from('classes').select('*');
    if (error) {
        console.error('Error fetching classes:', error.message);
        return;
    }

    console.log(`Found ${classes.length} classes.`);
    classes.forEach(c => {
        console.log(`Class: ${c.name} (ID: ${c.id})`);
        console.log(`  school_id: ${c.school_id}`);
        console.log(`  is_enrollment_open: ${c.is_enrollment_open}`);
        console.log(`  enrollment_deadline: ${c.enrollment_deadline}`);
        const deadline = c.enrollment_deadline ? new Date(c.enrollment_deadline) : null;
        const now = new Date();
        const isExpired = deadline ? deadline < now : false;
        console.log(`  Is deadline passed?: ${isExpired}`);
        console.log('---');
    });

    console.log('--- Checking Schools ---');
    const { data: schools, error: schoolError } = await supabase.from('schools').select('*');
    if (schoolError) {
        console.error('Error fetching schools:', schoolError.message);
        return;
    }
    console.log(`Found ${schools.length} schools.`);
    schools.forEach(s => {
        console.log(`School: ${s.name} (ID: ${s.id})`);
    });
}

checkClasses();
