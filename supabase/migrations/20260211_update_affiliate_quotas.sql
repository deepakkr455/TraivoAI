-- SQL Migration: Update Agent Affiliate Tiers with detailed Quotas

-- 1. Add new columns for precise quota management
ALTER TABLE public.agent_affiliate_tiers 
ADD COLUMN IF NOT EXISTS query_daily_quota INTEGER,
ADD COLUMN IF NOT EXISTS listings_quota INTEGER,
ADD COLUMN IF NOT EXISTS leads_quota INTEGER;

-- 2. Update existing tiers with correct quota data
-- Note: -1 represents Unlimited
UPDATE public.agent_affiliate_tiers SET
    query_daily_quota = 20,
    listings_quota = 30,
    leads_quota = 3,
    daily_quota = 0 -- Optional: Re-purpose for messages if needed
WHERE name = 'base';

UPDATE public.agent_affiliate_tiers SET
    query_daily_quota = 100,
    listings_quota = 60,
    leads_quota = 50,
    daily_quota = 0
WHERE name = 'standard';

UPDATE public.agent_affiliate_tiers SET
    query_daily_quota = 200,
    listings_quota = -1, -- Unlimited
    leads_quota = -1, -- Unlimited
    daily_quota = 0
WHERE name = 'pro';

-- 3. Update agent_affiliate_features with the new table mapping for display
-- This ensures the UI fetches the strings correctly
DELETE FROM public.agent_affiliate_features WHERE tier_name IN ('base', 'standard', 'pro');

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
