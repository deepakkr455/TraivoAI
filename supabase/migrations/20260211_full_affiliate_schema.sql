-- SQL Migration: Comprehensive Agent Affiliate Subscription Schema

-- 1. Create Agent Affiliate Tiers Table (The Plans)
CREATE TABLE IF NOT EXISTS public.agent_affiliate_tiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL, -- base, standard, pro
    query_daily_quota INTEGER DEFAULT 0,
    listings_quota INTEGER DEFAULT 0,
    leads_quota INTEGER DEFAULT 0,
    daily_quota INTEGER DEFAULT 0, -- Messages/Other
    monthly_price NUMERIC(10, 2) DEFAULT 0,
    quarterly_price NUMERIC(10, 2) DEFAULT 0,
    yearly_price NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Agent Affiliate Features Table (Display Labeling)
CREATE TABLE IF NOT EXISTS public.agent_affiliate_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier_name TEXT REFERENCES public.agent_affiliate_tiers(name) ON UPDATE CASCADE,
    feature_key TEXT NOT NULL,
    feature_label TEXT NOT NULL,
    control_value TEXT NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tier_name, feature_key)
);

-- 3. Create Agent Affiliate User Subscription Table (The Active Link)
CREATE TABLE IF NOT EXISTS public.agent_affiliate_user_subscription (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, 
    tier_name TEXT REFERENCES public.agent_affiliate_tiers(name) ON UPDATE CASCADE DEFAULT 'base',
    status TEXT DEFAULT 'active', 
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 4. Create Agent Affiliate Payment History Table
CREATE TABLE IF NOT EXISTS public.agent_affiliate_payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    plan_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL,
    payu_id TEXT,
    txnid TEXT UNIQUE NOT NULL,
    raw_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable RLS
ALTER TABLE public.agent_affiliate_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_affiliate_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_affiliate_user_subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_affiliate_payment_history ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
CREATE POLICY "Allow public read access to agent_affiliate_tiers" ON public.agent_affiliate_tiers FOR SELECT USING (true);
CREATE POLICY "Allow public read access to agent_affiliate_features" ON public.agent_affiliate_features FOR SELECT USING (true);
CREATE POLICY "Users can view own agent_affiliate_subscription" ON public.agent_affiliate_user_subscription FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own agent_affiliate_payment_history" ON public.agent_affiliate_payment_history FOR SELECT USING (auth.uid() = user_id);

-- 6. Insert/Update Initial Tiers
INSERT INTO public.agent_affiliate_tiers (name, query_daily_quota, listings_quota, leads_quota, monthly_price, quarterly_price, yearly_price)
VALUES
    ('base', 20, 30, 3, 0, 0, 0),
    ('standard', 100, 60, 50, 499, 1347.3, 4790),
    ('pro', 200, -1, -1, 999, 2697.3, 9590)
ON CONFLICT (name) DO UPDATE SET
    query_daily_quota = EXCLUDED.query_daily_quota,
    listings_quota = EXCLUDED.listings_quota,
    leads_quota = EXCLUDED.leads_quota,
    monthly_price = EXCLUDED.monthly_price,
    quarterly_price = EXCLUDED.quarterly_price,
    yearly_price = EXCLUDED.yearly_price;

-- 7. Insert/Update Features for Display
DELETE FROM public.agent_affiliate_features;
INSERT INTO public.agent_affiliate_features (tier_name, feature_key, feature_label, control_value)
VALUES
    -- Base Tier
    ('base', 'query', 'Query', '20 per day'),
    ('base', 'listings', 'Listings', '30'),
    ('base', 'analytics', 'Analytics & Insights', 'Basic'),
    ('base', 'inquiries', 'Inquiries', 'Queued'),
    ('base', 'recommendations', 'Recommendations', 'BiMonthly'),
    ('base', 'promotions', 'Promotions', 'No'),
    ('base', 'customer_inquiries', 'Customer Inquiries', '3 Leads (3 Customers)'),
    
    -- Standard Tier
    ('standard', 'query', 'Query', '100 per day'),
    ('standard', 'listings', 'Listings', '60'),
    ('standard', 'analytics', 'Analytics & Insights', 'Advance'),
    ('standard', 'inquiries', 'Inquiries', 'Priority'),
    ('standard', 'recommendations', 'Recommendations', 'Weekly'),
    ('standard', 'promotions', 'Promotions', 'On official channels'),
    ('standard', 'customer_inquiries', 'Customer Inquiries', '50 Leads (50 Customers)'),

    -- Pro Tier
    ('pro', 'query', 'Query', '200 per day'),
    ('pro', 'listings', 'Listings', 'Unlimited'),
    ('pro', 'analytics', 'Analytics & Insights', 'Advance'),
    ('pro', 'inquiries', 'Inquiries', 'Priority'),
    ('pro', 'recommendations', 'Recommendations', 'Often'),
    ('pro', 'promotions', 'Promotions', 'Official Channel As well as Ads'),
    ('pro', 'customer_inquiries', 'Customer Inquiries', 'Unlimited');
