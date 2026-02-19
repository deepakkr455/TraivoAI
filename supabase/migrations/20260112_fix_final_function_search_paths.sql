-- Fix role mutable search_path warnings for final batch of functions

-- 1. handle_new_user (Trigger function)
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 2. update_updated_at_column (Trigger function)
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 3. update_blog_interaction_counts (Trigger function)
ALTER FUNCTION public.update_blog_interaction_counts() SET search_path = public;

-- 4. toggle_blog_interaction
-- Args inferred: (p_blog_id uuid, p_user_id uuid, p_interaction_type text)
ALTER FUNCTION public.toggle_blog_interaction(uuid, uuid, text) SET search_path = public;

-- 5. notify_new_invitation (Trigger function)
ALTER FUNCTION public.notify_new_invitation() SET search_path = public;
