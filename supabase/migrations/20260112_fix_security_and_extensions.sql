-- 1. Create schema for future extensions
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 2. (SKIPPED) Move pg_net
-- We are skipping the move of pg_net because 'ALTER EXTENSION ... SET SCHEMA' is not supported, 
-- and DROP/CREATE carries risk of breaking existing 'net' schema dependencies.

-- 3. Fix search_path for send_invitation_email
-- Ensure public and extensions are in the path. 
-- Note: If http_request is in 'net' schema, you may need to add 'net' to this list.
-- Given 'pg_net' is in public, 'public' should suffice.
ALTER FUNCTION public.send_invitation_email() SET search_path = public, extensions;

-- 4. Secure b2b_conversations
ALTER TABLE public.b2b_conversations ENABLE ROW LEVEL SECURITY;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all operations for all users" ON public.b2b_conversations;

-- Secure Policies
-- 1. Users can manage their own conversations
CREATE POLICY "Users can manage their own conversations"
ON public.b2b_conversations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Business owners can view conversations related to their business
CREATE POLICY "Business owners can view conversations"
ON public.b2b_conversations
FOR SELECT
USING (auth.uid() = business_id);
