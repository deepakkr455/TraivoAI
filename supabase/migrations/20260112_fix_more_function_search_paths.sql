-- Fix role mutable search_path warnings for additional functions

-- 1. increment_affiliate_view
ALTER FUNCTION public.increment_affiliate_view(uuid) SET search_path = public;

-- 2. increment_affiliate_click
ALTER FUNCTION public.increment_affiliate_click(uuid) SET search_path = public;

-- 3. create_invitation_token (Trigger function, no args)
ALTER FUNCTION public.create_invitation_token() SET search_path = public;

-- 4. increment_blog_counter
ALTER FUNCTION public.increment_blog_counter(uuid, text) SET search_path = public;

-- 5. auto_accept_invitation (Trigger function, no args)
ALTER FUNCTION public.auto_accept_invitation() SET search_path = public;
