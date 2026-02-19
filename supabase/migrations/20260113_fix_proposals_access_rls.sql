-- Migration: Fix Proposals Access RLS
-- Allows plan members and guests with valid tokens to VIEW proposals.
-- ONLY plan owners can INSERT, UPDATE, or DELETE proposals.

-- 1. Enable RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to ensure a clean state
DROP POLICY IF EXISTS "Plan members can view proposals" ON public.proposals;
DROP POLICY IF EXISTS "Plan members can insert proposals" ON public.proposals;
DROP POLICY IF EXISTS "Plan owners can insert proposals" ON public.proposals;
DROP POLICY IF EXISTS "Plan members can update proposals" ON public.proposals;
DROP POLICY IF EXISTS "Plan owners can update proposals" ON public.proposals;
DROP POLICY IF EXISTS "Plan members can delete proposals" ON public.proposals;
DROP POLICY IF EXISTS "Plan owners can delete proposals" ON public.proposals;
DROP POLICY IF EXISTS "Allow members to view proposals" ON public.proposals;
DROP POLICY IF EXISTS "Allow members to insert proposals" ON public.proposals;
DROP POLICY IF EXISTS "Allow members to update proposals" ON public.proposals;
DROP POLICY IF EXISTS "Allow members to delete proposals" ON public.proposals;

-- 3. Create refined policies

-- SELECT: Allow anyone who is a plan member (owner, joined, invited, or token holder)
CREATE POLICY "Allow members to view proposals"
ON public.proposals
FOR SELECT
USING ( public.is_plan_member(plan_id) );

-- INSERT: Strictly only the plan owner
CREATE POLICY "Allow owners to insert proposals"
ON public.proposals
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT owner_id FROM public.plans WHERE id = plan_id
  )
);

-- UPDATE: Strictly only the plan owner
CREATE POLICY "Allow owners to update proposals"
ON public.proposals
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT owner_id FROM public.plans WHERE id = plan_id
  )
);

-- DELETE: Strictly only the plan owner
CREATE POLICY "Allow owners to delete proposals"
ON public.proposals
FOR DELETE
USING (
  auth.uid() IN (
    SELECT owner_id FROM public.plans WHERE id = plan_id
  )
);

-- 4. Ensure index exists for performance
CREATE INDEX IF NOT EXISTS idx_proposals_plan_id ON public.proposals USING btree (plan_id);

-- 5. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated, anon, service_role;
