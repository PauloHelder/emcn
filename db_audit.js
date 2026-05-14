
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdczoqsbwvittzaqvorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3pvcXNid3ZpdHR6YXF2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQ0NjAsImV4cCI6MjA4NjEwMDQ2MH0.fPxYv0DufwDmr9G5v-ThfeWSuLigf-oHiL5MNIy-mCU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllData() {
    console.log('--- Database Audit ---');

    const tables = ['schools', 'classes', 'students', 'teachers', 'disciplines', 'system_settings'];

    for (const table of tables) {
        const { data, count, error } = await supabase.from(table).select('*', { count: 'exact' });
        if (error) {
            console.log(`[Error] ${table}: ${error.message}`);
        } else {
            console.log(`[Table] ${table}: ${count} records`);
            if (data && data.length > 0) {
                console.log(`Sample data from ${table}:`, data[0]);
            }
        }
    }
}

listAllData();
