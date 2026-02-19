
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInteractions() {
    console.log('Checking product_interactions table...');
    console.log('URL:', supabaseUrl);

    // Check counts by type
    const { data: counts, error: countError } = await supabase
        .from('product_interactions')
        .select('interaction_type, location_city, location_country');

    if (countError) {
        console.error('Error fetching counts:', countError);
        return;
    }

    const typeCounts: Record<string, number> = {};
    (counts || []).forEach((row: any) => {
        typeCounts[row.interaction_type] = (typeCounts[row.interaction_type] || 0) + 1;
    });

    console.log('Interaction Type Counts:', typeCounts);

    // Check specific inquiry data
    const inquiries = (counts || []).filter((c: any) => c.interaction_type === 'inquiry');
    console.log(`Found ${inquiries.length} inquiries.`);

    if (inquiries.length > 0) {
        console.log('Sample Inquiry Locations:', inquiries.slice(0, 5));
    } else {
        console.log('No inquiries found. This explains why Market Mapping is empty.');
    }
}

checkInteractions();
