
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdczoqsbwvittzaqvorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3pvcXNid3ZpdHR6YXF2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQ0NjAsImV4cCI6MjA4NjEwMDQ2MH0.fPxYv0DufwDmr9G5v-ThfeWSuLigf-oHiL5MNIy-mCU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function task() {
    console.log('Tentando remover aluno Paulo Helder...');
    const { data, error, count } = await supabase
        .from('students')
        .delete({ count: 'exact' })
        .ilike('name', '%Paulo Helder%');

    if (error) {
        console.error('Erro ao remover:', error.message);
    } else {
        console.log(`Sucesso! Linhas removidas: ${count}`);
    }
}

task();
