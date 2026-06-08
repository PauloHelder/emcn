
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdczoqsbwvittzaqvorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3pvcXNid3ZpdHR6YXF2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQ0NjAsImV4cCI6MjA4NjEwMDQ2MH0.fPxYv0DufwDmr9G5v-ThfeWSuLigf-oHiL5MNIy-mCU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugEnrollments() {
    console.log('--- Debugging Enrollments ---');

    // 1. Fetch all students
    const { data: students, error: sError } = await supabase.from('students').select('*');
    console.log(`Total students in DB: ${students?.length || 0}`);
    if (students) {
        students.forEach(s => console.log(`  - Student: ${s.name} (ID: ${s.id}, Email: ${s.email})`));
    }

    // 2. Fetch all classes
    const { data: classes, error: cError } = await supabase.from('classes').select('*');
    console.log(`Total classes in DB: ${classes?.length || 0}`);
    if (classes) {
        classes.forEach(c => {
            console.log(`  - Class: ${c.name} (ID: ${c.id})`);
            console.log(`    Linked Student IDs: ${JSON.stringify(c.students)}`);
            if (c.students && c.students.length > 0) {
                c.students.forEach(sid => {
                    const found = students?.find(s => s.id === sid || s.id == sid); // check type as well
                    if (!found) {
                        console.log(`    ⚠️  WARNING: Student ID ${sid} not found in students table!`);
                    } else {
                        console.log(`    ✅ Found Student: ${found.name}`);
                    }
                });
            }
        });
    }
}

debugEnrollments();
