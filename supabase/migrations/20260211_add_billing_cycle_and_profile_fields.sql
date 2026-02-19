-- Migration: Add billing_cycle and profile synchronization fields

-- 1. Add billing_cycle to user_subscriptions
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';

-- 2. Add billing_cycle to agent_affiliate_user_subscription
ALTER TABLE public.agent_affiliate_user_subscription 
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';

-- 3. Update profiles table to track subscription status globally
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS user_module_type TEXT DEFAULT 'customer';

-- 4. Initial sync for existing users (Optional but good for data integrity)
-- Update existing affiliates based on their subscription record if it exists
UPDATE public.profiles p
SET 
  subscription_tier = s.tier_name,
  user_module_type = 'affiliate'
FROM public.agent_affiliate_user_subscription s
WHERE p.id = s.user_id;

-- Update existing customers based on their subscription record
UPDATE public.profiles p
SET 
  subscription_tier = s.plan_name,
  user_module_type = 'customer'
FROM public.user_subscriptions s
WHERE p.id = s.user_id;
