-- Migration: Fix Collaboration RLS (Doubts and Likes)
-- Ensures plan members can chat and vote, with owners having management rights.

-- 1. Table: public.doubts
ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow members to view doubts" ON public.doubts;
DROP POLICY IF EXISTS "Allow members to insert doubts" ON public.doubts;
DROP POLICY IF EXISTS "Allow users to update own doubts" ON public.doubts;
DROP POLICY IF EXISTS "Allow users/owners to delete doubts" ON public.doubts;

-- All plan members can view messages
CREATE POLICY "Allow members to view doubts"
ON public.doubts FOR SELECT
USING ( public.is_plan_member(plan_id) );

-- All plan members can post messages
CREATE POLICY "Allow members to insert doubts"
ON public.doubts FOR INSERT
WITH CHECK ( public.is_plan_member(plan_id) );

-- Users can update their own messages
CREATE POLICY "Allow users to update own doubts"
ON public.doubts FOR UPDATE
USING ( auth.uid() = user_id );

-- Users can delete their own messages, OR plan owners can delete any message in the plan
CREATE POLICY "Allow users/owners to delete doubts"
ON public.doubts FOR DELETE
USING ( 
  auth.uid() = user_id 
  OR 
  auth.uid() IN (SELECT owner_id FROM public.plans WHERE id = plan_id)
);

-- 2. Table: public.likes (Voting)
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read likes" ON public.likes;
DROP POLICY IF EXISTS "Users manage own likes" ON public.likes;
DROP POLICY IF EXISTS "Allow members to view likes" ON public.likes;
DROP POLICY IF EXISTS "Allow members to manage own likes" ON public.likes;

-- Members can see likes for proposals in their plans
CREATE POLICY "Allow members to view likes"
ON public.likes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = proposal_id
    AND public.is_plan_member(p.plan_id)
  )
);

-- Members can insert/delete their own likes
CREATE POLICY "Allow members to manage own likes"
ON public.likes FOR ALL
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = proposal_id
    AND public.is_plan_member(p.plan_id)
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = proposal_id
    AND public.is_plan_member(p.plan_id)
  )
);

-- indices for performance
CREATE INDEX IF NOT EXISTS idx_doubts_plan_id ON public.doubts(plan_id);
CREATE INDEX IF NOT EXISTS idx_likes_proposal_id ON public.likes(proposal_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doubts TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.likes TO authenticated, anon;
