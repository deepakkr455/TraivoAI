
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBanners() {
    const { data, error } = await supabase
        .from('affiliate_listings')
        .select('id, affiliate_source, banner_type, is_active');

    if (error) {
        console.error('Error fetching banners:', error);
        return;
    }

    console.log('--- Affiliate Banners ---');
    console.table(data);

    const stats = data.reduce((acc, curr) => {
        const key = `${curr.affiliate_source} | ${curr.banner_type}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    console.log('--- Stats ---');
    console.log(stats);
}

checkBanners();
