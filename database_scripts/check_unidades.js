
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdczoqsbwvittzaqvorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3pvcXNid3ZpdHR6YXF2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQ0NjAsImV4cCI6MjA4NjEwMDQ2MH0.fPxYv0DufwDmr9G5v-ThfeWSuLigf-oHiL5MNIy-mCU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUnidadesClasses() {
    const { data, count, error } = await supabase.from('unidades_classes').select('*', { count: 'exact' });
    if (error) {
        console.log(`Table unidades_classes: Error ${error.message}`);
    } else {
        console.log(`Table unidades_classes: ${count} records`);
        if (data && data.length > 0) {
            console.log('Sample record:', data[0]);
        }
    }
}

checkUnidadesClasses();
