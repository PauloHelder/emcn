
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdczoqsbwvittzaqvorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3pvcXNid3ZpdHR6YXF2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQ0NjAsImV4cCI6MjA4NjEwMDQ2MH0.fPxYv0DufwDmr9G5v-ThfeWSuLigf-oHiL5MNIy-mCU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function task() {
    const studentName = 'Paulo Helder';

    console.log(`Buscando aluno: ${studentName}...`);

    const { data: students, error: findError } = await supabase
        .from('students')
        .select('*')
        .ilike('name', `%${studentName}%`);

    if (findError) {
        console.error('Erro ao buscar aluno:', findError.message);
        return;
    }

    if (!students || students.length === 0) {
        console.log('Aluno não encontrado no banco de dados.');
        return;
    }

    console.log(`Encontrado(s) ${students.length} aluno(s):`);
    students.forEach(s => console.log(`- ID: ${s.id}, Nome: ${s.name}, Status: ${s.status}`));

    for (const student of students) {
        console.log(`Removendo aluno ID ${student.id}...`);
        const { error: deleteError } = await supabase
            .from('students')
            .delete()
            .eq('id', student.id);

        if (deleteError) {
            console.error(`Erro ao remover aluno ${student.id}:`, deleteError.message);
        } else {
            console.log(`Aluno ${student.id} removido com sucesso.`);
        }
    }
}

task();
