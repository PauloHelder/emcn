
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdczoqsbwvittzaqvorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3pvcXNid3ZpdHR6YXF2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQ0NjAsImV4cCI6MjA4NjEwMDQ2MH0.fPxYv0DufwDmr9G5v-ThfeWSuLigf-oHiL5MNIy-mCU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const tables = ['students', 'teachers', 'disciplines', 'classes', 'schools'];
    for (const table of tables) {
        const { data, count, error } = await supabase.from(table).select('*', { count: 'exact', head: false });
        if (error) {
            console.log(`Erro em ${table}:`, error.message);
        } else {
            console.log(`${table}: ${data.length} registros (total ${count})`);
            if (data.length > 0 && table === 'students') {
                console.log('Exemplos de students:', data.map(s => ({ id: s.id, name: s.name, status: s.status })));
            }
        }
    }
}

check();
