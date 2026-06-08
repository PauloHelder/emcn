
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdczoqsbwvittzaqvorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3pvcXNid3ZpdHR6YXF2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQ0NjAsImV4cCI6MjA4NjEwMDQ2MH0.fPxYv0DufwDmr9G5v-ThfeWSuLigf-oHiL5MNIy-mCU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findClassesTable() {
    const names = ['classes', 'class_groups', 'groups', 'turmas', 'unidades_classes'];
    for (const name of names) {
        const { data, error } = await supabase.from(name).select('*', { count: 'exact', head: true });
        if (!error) {
            const { count } = await supabase.from(name).select('*', { count: 'exact', head: true });
            console.log(`Found table: ${name} with ${count} records`);
        } else {
            console.log(`Table ${name} NOT found or error: ${error.message}`);
        }
    }
}

findClassesTable();
