-- Migration: Fix RLS Recursion and Update Database Schema
-- Strategy: Use a SECURITY DEFINER function for membership checks to break RLS mutual recursion loops.

-- 1. CLEANUP: Drop all existing policies for affected tables to ensure a clean state
DO $$
DECLARE
  pol record;
  tables_to_clean text[] := ARRAY['plans', 'plan_members', 'invitations', 'invitation_tokens'];
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = ANY(tables_to_clean)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 2. SCHEMA UPDATE: Ensure tables exist and match requested structure
-- Table: plans
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'planning', -- Using text if plan_status type is missing, or adjust if type exists
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  plan_json jsonb NULL,
  is_public boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NULL DEFAULT now(),
  updated_plan_json jsonb NULL,
  track_expenses boolean NULL,
  CONSTRAINT plans_pkey PRIMARY KEY (id),
  CONSTRAINT plans_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users (id)
);

-- Ensure track_expenses exists if table was already present
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='track_expenses') THEN
        ALTER TABLE public.plans ADD COLUMN track_expenses boolean DEFAULT false;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_plans_json ON public.plans USING GIN (plan_json);
CREATE INDEX IF NOT EXISTS idx_plans_owner_id ON public.plans USING BTREE (owner_id);

-- Table: invitations
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL,
  invited_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending', 
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT invitations_pkey PRIMARY KEY (id),
  CONSTRAINT invitations_plan_id_invited_email_key UNIQUE (plan_id, invited_email),
  CONSTRAINT invitations_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans (id) ON DELETE CASCADE
);

-- Table: invitation_tokens
CREATE TABLE IF NOT EXISTS public.invitation_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL,
  token text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '7 days'::interval),
  CONSTRAINT invitation_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT invitation_tokens_invitation_id_key UNIQUE (invitation_id),
  CONSTRAINT invitation_tokens_token_key UNIQUE (token),
  CONSTRAINT invitation_tokens_invitation_id_fkey FOREIGN KEY (invitation_id) REFERENCES public.invitations (id) ON DELETE CASCADE
);

-- 3. FUNCTIONS: Define Security Core
-- Fix role mutable search_path warnings and break recursion
CREATE OR REPLACE FUNCTION public.is_plan_member(p_plan_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Essential: runs as owner (postgres) to bypass RLS on child tables
STABLE
SET search_path = public, extensions
AS $$
BEGIN
  RETURN EXISTS (
    -- Case 1: Is Owner
    SELECT 1 FROM public.plans WHERE id = p_plan_id AND owner_id = auth.uid()
    UNION ALL
    -- Case 2: Is Member
    SELECT 1 FROM public.plan_members WHERE plan_id = p_plan_id AND user_id = auth.uid()
    UNION ALL
    -- Case 3: Is Invited
    SELECT 1 FROM public.invitations 
    WHERE plan_id = p_plan_id 
    AND invited_email = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
    AND status = 'pending'
  );
END;
$$;

-- handle_new_plan trigger function
CREATE OR REPLACE FUNCTION public.handle_new_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO public.plan_members (plan_id, user_id, user_name)
  VALUES (
    NEW.id,
    NEW.owner_id,
    COALESCE(
      (SELECT full_name FROM public.profiles WHERE id = NEW.owner_id),
      'User ' || LEFT(NEW.owner_id::text, 8)
    )
  )
  ON CONFLICT (plan_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 4. TRIGGERS
DROP TRIGGER IF EXISTS on_plan_created ON public.plans;
CREATE TRIGGER on_plan_created
AFTER INSERT ON public.plans
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_plan();

-- 5. RLS POLICIES: Break Recursion

-- Table: plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_select_policy" ON public.plans
FOR SELECT TO authenticated
USING (is_public OR is_plan_member(id));

CREATE POLICY "plans_modify_owner" ON public.plans
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Table: plan_members
ALTER TABLE public.plan_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_members_select_policy" ON public.plan_members
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_plan_member(plan_id));

CREATE POLICY "plan_members_modify_owner" ON public.plan_members
FOR ALL TO authenticated
USING (
    user_id = auth.uid() 
    OR 
    EXISTS (SELECT 1 FROM public.plans WHERE id = plan_id AND owner_id = auth.uid())
);

-- Table: invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_select_policy" ON public.invitations
FOR SELECT TO authenticated
USING (invited_email = LOWER(COALESCE(auth.jwt() ->> 'email', '')) OR is_plan_member(plan_id));

CREATE POLICY "invitations_manage_owner" ON public.invitations
FOR ALL TO authenticated
USING (is_plan_member(plan_id));

-- Table: invitation_tokens (usually managed by triggers/functions, but for completeness)
ALTER TABLE public.invitation_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tokens_select_policy" ON public.invitation_tokens
FOR SELECT TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.invitations 
    WHERE id = invitation_id AND (invited_email = LOWER(COALESCE(auth.jwt() ->> 'email', '')) OR is_plan_member(plan_id))
));

-- 6. GRANT EXECUTE
GRANT EXECUTE ON FUNCTION public.is_plan_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_plan() TO authenticated, service_role;
