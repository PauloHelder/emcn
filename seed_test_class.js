
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdczoqsbwvittzaqvorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3pvcXNid3ZpdHR6YXF2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQ0NjAsImV4cCI6MjA4NjEwMDQ2MH0.fPxYv0DufwDmr9G5v-ThfeWSuLigf-oHiL5MNIy-mCU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedClass() {
    console.log('Seeding an open class...');

    // First, let's get a school ID
    const { data: schools } = await supabase.from('schools').select('id, name');
    if (!schools || schools.length === 0) {
        console.error('No schools found. Please create a school first.');
        return;
    }

    const schoolId = schools[0].id;
    console.log(`Using school: ${schools[0].name} (${schoolId})`);

    const newClass = {
        name: 'Turma de Teste 2025',
        year: 2025,
        students: [],
        sessions: [],
        school_id: schoolId,
        is_enrollment_open: true,
        enrollment_deadline: '2025-12-31',
        enrollment_message: 'Seja bem-vindo à turma de teste! Comece sua jornada aqui.',
        enrollment_requirements: ['Ser membro de uma igreja', 'Ter disponibilidade aos sábados']
    };

    const { data, error } = await supabase.from('classes').insert([newClass]).select();

    if (error) {
        console.error('Error seeding class:', error.message);
    } else {
        console.log('Class seeded successfully:', data);
    }
}

seedClass();
