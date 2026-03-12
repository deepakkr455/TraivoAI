-- Migration: Handle Onboarding Notifications
-- Detects changes in profiles.onboarding_status and triggers a webhook for email notifications.

-- 1. Create the function to trigger the Edge Function
CREATE OR REPLACE FUNCTION public.handle_onboarding_status_change()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
BEGIN
    -- Only trigger if status has changed
    IF (OLD.onboarding_status IS DISTINCT FROM NEW.onboarding_status) THEN
        payload := jsonb_build_object(
            'record', jsonb_build_object(
                'user_id', NEW.id,
                'email', NEW.email,
                'full_name', NEW.full_name,
                'old_status', OLD.onboarding_status,
                'new_status', NEW.onboarding_status
            )
        );

        -- Perform the HTTP request to the Edge Function
        -- Note: We use net_pg_hooks or similar if available, or just standard Supabase Edge Function trigger
        -- For a clean standard implementation, we'll use a standard trigger that can be picked up by Supabase
        -- but since we want to be explicit, here is the net_http approach if the extension is enabled.
        -- ALTERNATIVELY, we can just let the Edge Function be triggered by standard Supabase Realtime/Webhooks 
        -- configured in the dashboard. However, putting logic in SQL is more robust for "Admin" changes.
        
        -- To keep it simple and portable without extra extensions:
        -- Admin can manually configure a Webhook in Supabase Dashboard for: 
        -- Table: profiles, Event: UPDATE, Filter: onboarding_status IS DISTINCT FROM
        -- But I will provide the SQL for a custom notification log table which is safer to trigger from.
        
        INSERT INTO public.onboarding_notification_logs (user_id, status_change, payload)
        VALUES (NEW.id, NEW.onboarding_status, payload);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a logs table to ensure we have a record and to provide a clean trigger source
CREATE TABLE IF NOT EXISTS public.onboarding_notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status_change TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create the trigger
DROP TRIGGER IF EXISTS on_onboarding_status_change ON public.profiles;
CREATE TRIGGER on_onboarding_status_change
    AFTER UPDATE OF onboarding_status ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_onboarding_status_change();

-- 4. Enable RLS on logs (Admin only ideally, but for now we'll just enable it)
ALTER TABLE public.onboarding_notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all logs" ON public.onboarding_notification_logs FOR SELECT USING (auth.role() = 'service_role');
