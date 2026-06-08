import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdczoqsbwvittzaqvorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3pvcXNid3ZpdHR6YXF2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQ0NjAsImV4cCI6MjA4NjEwMDQ2MH0.fPxYv0DufwDmr9G5v-ThfeWSuLigf-oHiL5MNIy-mCU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStudentColumns() {
    console.log('--- Checking students table sample ---');
    const { data, error } = await supabase.from('students').select('*').limit(1);
    if (error) {
        console.error('Error fetching students:', error);
    } else {
        if (data && data.length > 0) {
            console.log('Student record keys:', Object.keys(data[0]));
            console.log('Full record:', data[0]);
        } else {
            console.log('No student records found.');
        }
    }
}

checkStudentColumns();
