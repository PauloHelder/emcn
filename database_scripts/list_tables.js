
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdczoqsbwvittzaqvorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3pvcXNid3ZpdHR6YXF2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQ0NjAsImV4cCI6MjA4NjEwMDQ2MH0.fPxYv0DufwDmr9G5v-ThfeWSuLigf-oHiL5MNIy-mCU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAll() {
    // There is no direct "list tables" in PostgREST, but we can try common names
    const commonTables = ['students', 'teachers', 'disciplines', 'classes', 'schools', 'enrollments', 'candidatos', 'users', 'system_settings'];
    for (const table of commonTables) {
        const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (!error) {
            console.log(`Tabela encontrada: ${table}`);
        }
    }
}

listAll();
