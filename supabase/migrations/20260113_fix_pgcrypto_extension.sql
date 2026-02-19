-- 1. Ensure extensions schema exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Enable pgcrypto in the extensions schema
-- Using 'extensions' schema is a best practice to keep 'public' clean
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 3. Fix search_path for functions that likely use gen_random_bytes to generate tokens
-- This ensures that when these functions run, they can find pgcrypto functions in the 'extensions' schema
-- and your own tables in the 'public' schema.

-- create_invitation_token: Likely generates a random token upon invitation insert
ALTER FUNCTION public.create_invitation_token() SET search_path = public, extensions;

-- send_invitation_trigger: Trigger function that might call token generation or email logic
ALTER FUNCTION public.send_invitation_trigger() SET search_path = public, extensions;

-- notify_new_invitation: Another potential trigger function for notifications
ALTER FUNCTION public.notify_new_invitation() SET search_path = public, extensions;

-- send_invitation_email: Sends the actual email, may need extensions for token lookup or generation
ALTER FUNCTION public.send_invitation_email() SET search_path = public, extensions;

-- 4. Grant usage on extensions schema to all roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
