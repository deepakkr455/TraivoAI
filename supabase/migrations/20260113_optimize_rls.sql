-- Optimize RLS policies to resolve "Auth RLS Initialization Plan" warnings
-- We wrap auth.uid() and auth.role() in scalar subqueries (select ...) to force single evaluation.

-- 1. invitations
DROP POLICY IF EXISTS "Plan owners can view invitations" ON public.invitations;
CREATE POLICY "Plan owners can view invitations"
ON public.invitations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Plan owners can create invitations" ON public.invitations;
CREATE POLICY "Plan owners can create invitations"
ON public.invitations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Plan owners can delete invitations" ON public.invitations;
CREATE POLICY "Plan owners can delete invitations"
ON public.invitations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
);

-- 2. proposals
DROP POLICY IF EXISTS "Plan owners can manage proposals" ON public.proposals;
-- Note: Breaking down management into specific policies for clarity if needed, but here we reuse the concept
-- Actually, the previous migration created specific policies or a general one? 
-- Let's check 20260112_fix_proposals_rls.sql: 
-- It created "Plan members can view proposals" and "Plan owners can insert proposals", "Plan owners can update proposals", "Plan owners can delete proposals".
-- We will optimize the OWNER ones. The MEMBER one uses is_plan_member() which we leave as is for now.

DROP POLICY IF EXISTS "Plan owners can insert proposals" ON public.proposals;
CREATE POLICY "Plan owners can insert proposals"
ON public.proposals
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Plan owners can update proposals" ON public.proposals;
CREATE POLICY "Plan owners can update proposals"
ON public.proposals
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Plan owners can delete proposals" ON public.proposals;
CREATE POLICY "Plan owners can delete proposals"
ON public.proposals
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
);

-- 3. b2b_conversations
DROP POLICY IF EXISTS "Users can manage their own conversations" ON public.b2b_conversations;
CREATE POLICY "Users can manage their own conversations"
ON public.b2b_conversations
FOR ALL
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Business owners can view conversations" ON public.b2b_conversations;
CREATE POLICY "Business owners can view conversations"
ON public.b2b_conversations
FOR SELECT
USING ((SELECT auth.uid()) = business_id);

-- 4. listed_products
DROP POLICY IF EXISTS "Business owners can insert their own products" ON public.listed_products;
CREATE POLICY "Business owners can insert their own products"
ON public.listed_products
FOR INSERT
WITH CHECK ((SELECT auth.uid()) = business_id);

-- 5. contacts
DROP POLICY IF EXISTS "Allow public contact form submissions" ON public.contacts;
CREATE POLICY "Allow public contact form submissions"
ON public.contacts
FOR INSERT
WITH CHECK ((SELECT auth.role()) = 'anon');
