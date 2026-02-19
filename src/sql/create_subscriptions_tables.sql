-- SQL Migration: Store Subscription Tiers and Feature Usage Controls

-- 1. Create Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL, -- free, base, pro, advance, custom
    daily_quota INTEGER,
    monthly_quota INTEGER,
    monthly_price NUMERIC(10, 2),
    quarterly_price NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Feature Usage Controls Table
CREATE TABLE IF NOT EXISTS public.feature_usage_controls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_name TEXT REFERENCES public.subscriptions(name) ON UPDATE CASCADE,
    feature_key TEXT NOT NULL,
    feature_label TEXT NOT NULL,
    control_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(plan_name, feature_key)
);

-- 3. Create User Subscriptions Table (To link users to plans)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- References auth.users(id)
    plan_name TEXT REFERENCES public.subscriptions(name) ON UPDATE CASCADE DEFAULT 'free',
    status TEXT DEFAULT 'active', -- active, trialing, past_due, canceled
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE, -- NULL for free tier
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 4. Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Allow anyone to read plan details
CREATE POLICY "Allow public read access to subscriptions" ON public.subscriptions
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to feature_controls" ON public.feature_usage_controls
    FOR SELECT USING (true);

-- Users can read their own subscription status
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- 6. Insert Initial Data from Image
INSERT INTO public.subscriptions (name, daily_quota, monthly_quota, monthly_price, quarterly_price)
VALUES
    ('free', 10, 300, 0, 0),
    ('base', 30, 900, 499, 1422.15),
    ('pro', 100, 3000, 999, 2847.15),
    ('advance', 200, 6000, 1499, 4272.15),
    ('custom', NULL, NULL, NULL, NULL)
ON CONFLICT (name) DO UPDATE SET
    daily_quota = EXCLUDED.daily_quota,
    monthly_quota = EXCLUDED.monthly_quota,
    monthly_price = EXCLUDED.monthly_price,
    quarterly_price = EXCLUDED.quarterly_price;

-- 7. Insert Feature Controls
-- (Plan values exactly as shown in the image)
INSERT INTO public.feature_usage_controls (plan_name, feature_key, feature_label, control_value)
VALUES
    -- Base Plan
    ('base', 'queries', 'Queries', '30/day'),
    ('base', 'day_trip_map', 'Create Map for A day Trip plan', 'Yes'),
    ('base', 'web_search', 'Web Search for Travel Queries', 'Yes'),
    ('base', 'itinerary_creation', 'Create Plan Itinerary (Solo, Family, Friends etc)', '15/Monthly'),
    ('base', 'weather_report', 'Generate Weather Report', 'Yes'),
    ('base', 'collaboration', 'Invite and Collaborate with Friends on Created Plan Itinerary', 'Unlimited'),
    ('base', 'expense_tracking', 'Expense Tracking', 'No'),
    ('base', 'deals_discounts', 'Best Deals & Discounts', 'No'),
    ('base', 'ai_recommendations', 'Basic AI Recommendations', 'No'),

    -- Pro Plan
    ('pro', 'queries', 'Queries', '100/day'),
    ('pro', 'day_trip_map', 'Create Map for A day Trip plan', 'Yes'),
    ('pro', 'web_search', 'Web Search for Travel Queries', 'Yes'),
    ('pro', 'itinerary_creation', 'Create Plan Itinerary (Solo, Family, Friends etc)', '30/Monthly'),
    ('pro', 'weather_report', 'Generate Weather Report', 'Yes'),
    ('pro', 'collaboration', 'Invite and Collaborate with Friends on Created Plan Itinerary', 'Unlimited'),
    ('pro', 'expense_tracking', 'Expense Tracking', 'Unlimited'),
    ('pro', 'deals_discounts', 'Best Deals & Discounts', 'Yes'),
    ('pro', 'ai_recommendations', 'Basic AI Recommendations', 'Yes'),

    -- Advance Plan
    ('advance', 'queries', 'Queries', '200/day'),
    ('advance', 'day_trip_map', 'Create Map for A day Trip plan', 'Yes'),
    ('advance', 'web_search', 'Web Search for Travel Queries', 'Yes'),
    ('advance', 'itinerary_creation', 'Create Plan Itinerary (Solo, Family, Friends etc)', '50/Monthly'),
    ('advance', 'weather_report', 'Generate Weather Report', 'Yes'),
    ('advance', 'collaboration', 'Invite and Collaborate with Friends on Created Plan Itinerary', 'Unlimited'),
    ('advance', 'expense_tracking', 'Expense Tracking', 'Unlimited'),
    ('advance', 'deals_discounts', 'Best Deals & Discounts', 'Personalized'),
    ('advance', 'ai_recommendations', 'Basic AI Recommendations', 'Personalized'),

    -- Custom Plan
    ('custom', 'queries', 'Queries', 'Contact Us'),
    ('custom', 'day_trip_map', 'Create Map for A day Trip plan', 'Contact Us'),
    ('custom', 'web_search', 'Web Search for Travel Queries', 'Contact Us'),
    ('custom', 'itinerary_creation', 'Create Plan Itinerary (Solo, Family, Friends etc)', 'Contact Us'),
    ('custom', 'weather_report', 'Generate Weather Report', 'Contact Us'),
    ('custom', 'collaboration', 'Invite and Collaborate with Friends on Created Plan Itinerary', 'Contact Us'),
    ('custom', 'expense_tracking', 'Expense Tracking', 'Contact Us'),
    ('custom', 'deals_discounts', 'Best Deals & Discounts', 'Contact Us'),
    ('custom', 'ai_recommendations', 'Basic AI Recommendations', 'Contact Us'),

    -- Free Plan (Defaults)
    ('free', 'queries', 'Queries', '10/day'),
    ('free', 'day_trip_map', 'Create Map for A day Trip plan', 'No'),
    ('free', 'web_search', 'Web Search for Travel Queries', 'No'),
    ('free', 'itinerary_creation', 'Create Plan Itinerary (Solo, Family, Friends etc)', '5/Monthly'),
    ('free', 'weather_report', 'Generate Weather Report', 'No'),
    ('free', 'collaboration', 'Invite and Collaborate with Friends on Created Plan Itinerary', 'No'),
    ('free', 'expense_tracking', 'Expense Tracking', 'No'),
    ('free', 'deals_discounts', 'Best Deals & Discounts', 'No'),
    ('free', 'ai_recommendations', 'Basic AI Recommendations', 'No')
ON CONFLICT (plan_name, feature_key) DO UPDATE SET
    control_value = EXCLUDED.control_value,
    feature_label = EXCLUDED.feature_label;
