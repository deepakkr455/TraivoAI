-- Migration: Optimize RLS Performance
-- 1. Mark is_plan_member as STABLE to allow query planner optimizations
-- 2. Wrap auth.uid() in scalar subqueries (SELECT auth.uid()) to prevent per-row re-evaluation

-- 1. Optimize is_plan_member function
CREATE OR REPLACE FUNCTION public.is_plan_member(p_plan_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE -- Marked as STABLE for performance
SET search_path = public, extensions
AS $$
BEGIN
  RETURN EXISTS (
    -- Case 1: User is the owner
    SELECT 1 FROM public.plans WHERE id = p_plan_id AND owner_id = (SELECT auth.uid())
    UNION
    -- Case 2: User is a joined member
    SELECT 1 FROM public.plan_members WHERE plan_id = p_plan_id AND user_id = (SELECT auth.uid())
    UNION
    -- Case 3: User has a pending invitation for their email
    SELECT 1 FROM public.invitations 
    WHERE plan_id = p_plan_id 
    AND invited_email = LOWER((SELECT auth.email()))
    AND status = 'pending'
    UNION
    -- Case 4: The plan has an active invitation token (allows preview)
    SELECT 1 FROM public.invitations i
    JOIN public.invitation_tokens it ON it.invitation_id = i.id
    WHERE i.plan_id = p_plan_id
    AND i.status = 'pending'
    AND it.expires_at > now()
  );
END;
$$;

-- 2. Optimize user_personalizations policies
DROP POLICY IF EXISTS "Users can manage their own personalizations" ON public.user_personalizations;
DROP POLICY IF EXISTS "Users can manage their own personalization" ON public.user_personalizations; -- Handle typo/alt name
CREATE POLICY "Users can manage their own personalizations"
ON public.user_personalizations
FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- 3. Optimize affiliate_listings policies
DROP POLICY IF EXISTS "Users can manage their own affiliate listings" ON public.affiliate_listings;
CREATE POLICY "Users can manage their own affiliate listings"
ON public.affiliate_listings
FOR ALL
USING (user_id = (SELECT auth.uid()));

-- 4. Optimize listed_products policies
DROP POLICY IF EXISTS "Business owners can insert their own products" ON public.listed_products;
DROP POLICY IF EXISTS "Agents can manage their own products" ON public.listed_products; -- From 20260113_fix_deals_and_affiliates_rls.sql
CREATE POLICY "Agents can manage their own products"
ON public.listed_products
FOR ALL
USING (business_id = (SELECT auth.uid()))
WITH CHECK (business_id = (SELECT auth.uid()));

-- 5. Optimize proposals policies
-- We are replacing policies to ensure auth.uid() is wrapped
DROP POLICY IF EXISTS "Allow owners to insert proposals" ON public.proposals;
CREATE POLICY "Allow owners to insert proposals"
ON public.proposals
FOR INSERT
WITH CHECK (
  (SELECT auth.uid()) IN (
    SELECT owner_id FROM public.plans WHERE id = plan_id
  )
);

DROP POLICY IF EXISTS "Allow owners to update proposals" ON public.proposals;
CREATE POLICY "Allow owners to update proposals"
ON public.proposals
FOR UPDATE
USING (
  (SELECT auth.uid()) IN (
    SELECT owner_id FROM public.plans WHERE id = plan_id
  )
);

DROP POLICY IF EXISTS "Allow owners to delete proposals" ON public.proposals;
CREATE POLICY "Allow owners to delete proposals"
ON public.proposals
FOR DELETE
USING (
  (SELECT auth.uid()) IN (
    SELECT owner_id FROM public.plans WHERE id = plan_id
  )
);

-- 6. Optimize expense_chats policies
DROP POLICY IF EXISTS "Users can view chats for trips they are members of" ON public.expense_chats;
CREATE POLICY "Users can view chats for trips they are members of"
ON public.expense_chats FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM plan_members
        WHERE plan_members.plan_id = expense_chats.plan_id
        AND plan_members.user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
        SELECT 1 FROM plans
        WHERE plans.id = expense_chats.plan_id
        AND plans.owner_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can insert chats for trips they are members of" ON public.expense_chats;
CREATE POLICY "Users can insert chats for trips they are members of"
ON public.expense_chats FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM plan_members
        WHERE plan_members.plan_id = expense_chats.plan_id
        AND plan_members.user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
        SELECT 1 FROM plans
        WHERE plans.id = expense_chats.plan_id
        AND plans.owner_id = (SELECT auth.uid())
    )
);

-- 7. Optimize doubts policies
DROP POLICY IF EXISTS "Allow users to update own doubts" ON public.doubts;
CREATE POLICY "Allow users to update own doubts"
ON public.doubts FOR UPDATE
USING ( user_id = (SELECT auth.uid()) );

DROP POLICY IF EXISTS "Allow users/owners to delete doubts" ON public.doubts;
CREATE POLICY "Allow users/owners to delete doubts"
ON public.doubts FOR DELETE
USING ( 
  user_id = (SELECT auth.uid())
  OR 
  (SELECT auth.uid()) IN (SELECT owner_id FROM public.plans WHERE id = plan_id)
);

-- 8. Optimize likes policies
DROP POLICY IF EXISTS "Allow members to manage own likes" ON public.likes;
CREATE POLICY "Allow members to manage own likes"
ON public.likes FOR ALL
USING (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = proposal_id
    AND public.is_plan_member(p.plan_id)
  )
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = proposal_id
    AND public.is_plan_member(p.plan_id)
  )
);

-- 9. Optimize product_interactions policies (ensure previous fix is also optimized)
DROP POLICY IF EXISTS "Agents can view interactions for their products" ON public.product_interactions;
CREATE POLICY "Agents can view interactions for their products" 
ON public.product_interactions 
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.listed_products lp
        WHERE lp.id = product_interactions.product_id
        AND lp.business_id = (SELECT auth.uid())
    )
);
