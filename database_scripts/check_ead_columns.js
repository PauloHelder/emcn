import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdczoqsbwvittzaqvorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3pvcXNid3ZpdHR6YXF2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQ0NjAsImV4cCI6MjA4NjEwMDQ2MH0.fPxYv0DufwDmr9G5v-ThfeWSuLigf-oHiL5MNIy-mCU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEadTables() {
    console.log('--- Checking EAD Tables ---');
    
    const { data: lessonsData, error: lessonsError } = await supabase.from('ead_lessons').select('*').limit(1);
    console.log('ead_lessons table exists?', !lessonsError, lessonsError ? `Error: ${lessonsError.message}` : '');

    const { data: subjectsData, error: subjectsError } = await supabase.from('ead_subjects').select('*').limit(1);
    console.log('ead_subjects table exists?', !subjectsError, subjectsError ? `Error: ${subjectsError.message}` : '');

    const { data: progressData, error: progressError } = await supabase.from('ead_progress').select('*').limit(1);
    console.log('ead_progress table exists?', !progressError, progressError ? `Error: ${progressError.message}` : '');
}

checkEadTables();
