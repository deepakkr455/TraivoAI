-- Fix role mutable search_path warnings by proactively setting search_path

-- 1. increment_product_view
ALTER FUNCTION public.increment_product_view(uuid) SET search_path = public;

-- 2. increment_product_click
ALTER FUNCTION public.increment_product_click(uuid) SET search_path = public;

-- 3. handle_new_plan
ALTER FUNCTION public.handle_new_plan() SET search_path = public;

-- 4. invite_user_to_plan
-- Note: Arguments inferred from user snippet (p_plan_id, p_email)
-- Assuming signature: invite_user_to_plan(uuid, text)
ALTER FUNCTION public.invite_user_to_plan(uuid, text) SET search_path = public;

-- 5. send_invitation_trigger
ALTER FUNCTION public.send_invitation_trigger() SET search_path = public;
