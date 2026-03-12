-- SQL Migration: Add Subscription Requests Table

CREATE TABLE IF NOT EXISTS public.subscription_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    billing_cycle TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'affiliate')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create their own subscription requests" 
ON public.subscription_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscription requests" 
ON public.subscription_requests FOR SELECT 
USING (auth.uid() = user_id);

-- Admin policies (assuming service role or specific admin users, but for now we'll rely on service role for edge functions)
-- If we had a specific admin role, we'd add it here.

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_subscription_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscription_requests_updated_at
    BEFORE UPDATE ON public.subscription_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_requests_updated_at();
