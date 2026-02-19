-- SQL Migration: Store Agent Affiliate Subscription Tiers and Feature Access

-- 1. Create Agent Affiliate Tiers Table
CREATE TABLE IF NOT EXISTS public.agent_affiliate_tiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL, -- free, pro, advance, custom
    daily_quota INTEGER,
    monthly_quota INTEGER,
    monthly_price NUMERIC(10, 2),
    quarterly_price NUMERIC(10, 2),
    yearly_price NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Agent Affiliate Features Table
CREATE TABLE IF NOT EXISTS public.agent_affiliate_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier_name TEXT REFERENCES public.agent_affiliate_tiers(name) ON UPDATE CASCADE,
    feature_key TEXT NOT NULL,
    feature_label TEXT NOT NULL,
    control_value TEXT NOT NULL, -- e.g., 'Yes', 'No', 'Unlimited', '50/Month'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tier_name, feature_key)
);

-- 3. Create Agent Affiliate User Subscription Table
CREATE TABLE IF NOT EXISTS public.agent_affiliate_user_subscription (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- References auth.users(id)
    tier_name TEXT REFERENCES public.agent_affiliate_tiers(name) ON UPDATE CASCADE DEFAULT 'free',
    status TEXT DEFAULT 'active', -- active, canceled, past_due
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE, -- NULL for free tier
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 4. Enable RLS
ALTER TABLE public.agent_affiliate_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_affiliate_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_affiliate_user_subscription ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Allow public read to tiers and features
CREATE POLICY "Allow public read access to agent_affiliate_tiers" ON public.agent_affiliate_tiers
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to agent_affiliate_features" ON public.agent_affiliate_features
    FOR SELECT USING (true);

-- Users can read their own subscription
CREATE POLICY "Users can view own agent_affiliate_subscription" ON public.agent_affiliate_user_subscription
    FOR SELECT USING (auth.uid() = user_id);

-- 6. Insert Initial Data
INSERT INTO public.agent_affiliate_tiers (name, daily_quota, monthly_quota, monthly_price, quarterly_price, yearly_price)
VALUES
    ('base', 3, 100, 0, 0, 0),
    ('standard', 50, 1500, 499, 1347.3, 4790),
    ('pro', 150, 5000, 999, 2697.3, 9590)
ON CONFLICT (name) DO UPDATE SET
    daily_quota = EXCLUDED.daily_quota,
    monthly_quota = EXCLUDED.monthly_quota,
    monthly_price = EXCLUDED.monthly_price,
    quarterly_price = EXCLUDED.quarterly_price,
    yearly_price = EXCLUDED.yearly_price;

-- 7. Insert Feature Access
INSERT INTO public.agent_affiliate_features (tier_name, feature_key, feature_label, control_value)
VALUES
    -- Base Tier
    ('base', 'listings', 'Listings', '30'),
    ('base', 'analytics', 'Analytics & Insights', 'Basic'),
    ('base', 'inquiries', 'Inquiries', 'Queued'),
    ('base', 'recommendations', 'Recommendations', 'BiMonthly'),
    ('base', 'promotions', 'Promotions', 'No'),
    
    -- Standard Tier
    ('standard', 'listings', 'Listings', '60'),
    ('standard', 'analytics', 'Analytics & Insights', 'Advance'),
    ('standard', 'inquiries', 'Inquiries', 'Priority'),
    ('standard', 'recommendations', 'Recommendations', 'Weekly'),
    ('standard', 'promotions', 'Promotions', 'On official channels'),

    -- Pro Tier
    ('pro', 'listings', 'Listings', 'Unlimited'),
    ('pro', 'analytics', 'Analytics & Insights', 'Advance'),
    ('pro', 'inquiries', 'Inquiries', 'Priority'),
    ('pro', 'recommendations', 'Recommendations', 'Often'),
    ('pro', 'promotions', 'Promotions', 'Official Channel As well as Ads')
ON CONFLICT (tier_name, feature_key) DO UPDATE SET
    control_value = EXCLUDED.control_value,
    feature_label = EXCLUDED.feature_label;
