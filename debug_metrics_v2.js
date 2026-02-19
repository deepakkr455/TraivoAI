
const { createClient } = require('@supabase/supabase-js');
// Hardcoded for debug based on what I see in other files or common pattern
const supabaseUrl = 'https://nmdtmfpgkclqerqitxoi.supabase.co'; // Found in some logs/context if I look hard
const supabaseKey = '...'; // I need to get this from somewhere safely

// Instead of hardcoding, I'll try to read it from .env file directly without'dotenv'
const fs = require('fs');
const path = require('path');

function getEnv() {
    try {
        const envPath = path.join(process.cwd(), '.env');
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        const env = {};
        lines.forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                env[parts[0].trim()] = parts.slice(1).join('=').trim();
            }
        });
        return env;
    } catch (e) {
        return {};
    }
}

const env = getEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
    console.error('Could not find Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
    console.log('Querying product_interactions...');
    const { data, error } = await supabase
        .from('product_interactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Results:');
    data.forEach(row => {
        console.log(`- Type: ${row.interaction_type}, Metadata: ${JSON.stringify(row.metadata)}, Created: ${row.created_at}`);
    });

    const { data: countData } = await supabase
        .from('product_interactions')
        .select('count', { count: 'exact', head: true })
        .or('interaction_type.eq.time_spent,metadata->>original_type.eq.time_spent');

    console.log('Count of time_spent tagged records:', countData);
}

run();
