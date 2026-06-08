
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdczoqsbwvittzaqvorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3pvcXNid3ZpdHR6YXF2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQ0NjAsImV4cCI6MjA4NjEwMDQ2MH0.fPxYv0DufwDmr9G5v-ThfeWSuLigf-oHiL5MNIy-mCU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanMock() {
    console.log('Buscando alunos...');
    const { data, error } = await supabase.from('students').select('id, name');

    if (error) {
        console.error('Erro ao buscar:', error);
        return;
    }

    console.log('Alunos encontrados:', data);

    const mockStudents = data.filter(s =>
        s.name.toLowerCase().includes('mock') ||
        s.name.toLowerCase().includes('teste') ||
        s.name === 'Candidato Exemplo'
    );

    if (mockStudents.length > 0) {
        for (const student of mockStudents) {
            console.log(`Removendo: ${student.name} (${student.id})`);
            const { error: delError } = await supabase
                .from('students')
                .delete()
                .eq('id', student.id);

            if (delError) {
                console.error('Erro ao deletar:', delError);
            } else {
                console.log('Sucesso! Aluno mock removido.');
            }
        }
    } else {
        console.log('Nenhum aluno mock encontrado.');
    }
}

cleanMock();
