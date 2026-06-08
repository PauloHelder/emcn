
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdczoqsbwvittzaqvorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3pvcXNid3ZpdHR6YXF2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQ0NjAsImV4cCI6MjA4NjEwMDQ2MH0.fPxYv0DufwDmr9G5v-ThfeWSuLigf-oHiL5MNIy-mCU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const tables = ['students', 'teachers', 'disciplines', 'classes', 'schools'];
    for (const table of tables) {
        const { data, count, error } = await supabase.from(table).select('*', { count: 'exact' });
        if (error) {
            console.log(`Erro em ${table}:`, error.message);
        } else {
            console.log(`${table}: ${count} registros`);
            if (data && data.length > 0) {
                console.log(`Primeiros 5 de ${table}:`);
                data.slice(0, 5).forEach(item => {
                    console.log(`  - ${item.name || item.id}`);
                });
            }
        }
    }
}

check();
