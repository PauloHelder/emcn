import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdczoqsbwvittzaqvorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3pvcXNid3ZpdHR6YXF2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQ0NjAsImV4cCI6MjA4NjEwMDQ2MH0.fPxYv0DufwDmr9G5v-ThfeWSuLigf-oHiL5MNIy-mCU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLocationTables() {
    console.log('--- Checking Location Tables ---');
    
    const tables = ['countries', 'provinces', 'municipalities', 'municipios', 'communes', 'comunas'];
    for (const table of tables) {
        const { data, count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`Table ${table}: Error - ${error.message}`);
        } else {
            console.log(`Table ${table}: Found with ${count} records`);
            const { data: sample } = await supabase.from(table).select('*').limit(1);
            if (sample && sample.length > 0) {
                console.log(`  Sample record:`, sample[0]);
            }
        }
    }
}

checkLocationTables();
