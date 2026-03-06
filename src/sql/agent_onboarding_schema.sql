-- Create Agent Onboarding Table
CREATE TABLE IF NOT EXISTS public.agent_onboarding (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    step_key TEXT NOT NULL, -- 'basic', 'identity'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'submitted', 'verified'
    details JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, step_key)
);

-- Enable RLS
ALTER TABLE public.agent_onboarding ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own onboarding" ON public.agent_onboarding
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding" ON public.agent_onboarding
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding" ON public.agent_onboarding
    FOR INSERT WITH CHECK (auth.uid() = user_id);
