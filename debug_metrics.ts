
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('--- Checking Product Interactions ---');
    const { data, error } = await supabase
        .from('product_interactions')
        .select('id, interaction_type, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Latest 10 interactions:');
    data.forEach(row => {
        console.log(`ID: ${row.id}, Type: ${row.interaction_type}, OriginalType: ${row.metadata?.original_type}, Duration: ${row.metadata?.duration_seconds}, CreatedAt: ${row.created_at}`);
    });

    const { data: timeData, error: timeError } = await supabase
        .from('product_interactions')
        .select('count')
        .or('interaction_type.eq.time_spent,metadata->>original_type.eq.time_spent');

    if (timeError) {
        console.error('Count Error:', timeError);
    } else {
        console.log(`Total "time_spent" records found: ${timeData?.[0]?.count || 0}`);
    }
}

checkData();
