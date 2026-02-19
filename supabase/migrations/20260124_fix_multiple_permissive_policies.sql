-- Migration: Fix Multiple Permissive Policies & Optimize RLS
-- Strategy: Drop ALL existing policies for affected tables to clear "Multiple Permissive" warnings,
-- then recreate unified, optimized policies using (SELECT auth.uid()) for performance.

-- 1. Dynamic Drop of ALL Policies for affected tables
DO $$
DECLARE
  pol record;
  tables_to_clean text[] := ARRAY[
    'plans', 
    'plan_members', 
    'doubts', 
    'likes', 
    'affiliate_listings', 
    'listed_products'
  ];
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

-- 2. Ensure is_plan_member is STABLE (Performance Fix)
CREATE OR REPLACE FUNCTION public.is_plan_member(p_plan_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, extensions
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.plans WHERE id = p_plan_id AND owner_id = (SELECT auth.uid())
    UNION
    SELECT 1 FROM public.plan_members WHERE plan_id = p_plan_id AND user_id = (SELECT auth.uid())
    UNION
    SELECT 1 FROM public.invitations 
    WHERE plan_id = p_plan_id 
    AND invited_email = LOWER((SELECT auth.email()))
    AND status = 'pending'
    UNION
    SELECT 1 FROM public.invitations i
    JOIN public.invitation_tokens it ON it.invitation_id = i.id
    WHERE i.plan_id = p_plan_id
    AND i.status = 'pending'
    AND it.expires_at > now()
  );
END;
$$;

-- 3. Recreate Policies for 'plans'
-- Combined SELECT policy
CREATE POLICY "Users can view their own, joined, or invited plans"
ON public.plans FOR SELECT
USING ( public.is_plan_member(id) );

-- Combined MANAGE policy (Owner only)
CREATE POLICY "Owners can manage their own plans"
ON public.plans FOR ALL
USING ( owner_id = (SELECT auth.uid()) )
WITH CHECK ( owner_id = (SELECT auth.uid()) );

-- 4. Recreate Policies for 'plan_members'
-- Unified SELECT: View if you are the user OR the plan owner
CREATE POLICY "Users and owners can view memberships"
ON public.plan_members FOR SELECT
USING (
  user_id = (SELECT auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
);

-- Unified DELETE: Remove yourself OR owner removes you
CREATE POLICY "Users and owners can delete memberships"
ON public.plan_members FOR DELETE
USING (
  user_id = (SELECT auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
);

-- 5. Recreate Policies for 'doubts'
-- SELECT: Plan members
CREATE POLICY "Plan members can view doubts"
ON public.doubts FOR SELECT
USING ( public.is_plan_member(plan_id) );

-- INSERT: Plan members
CREATE POLICY "Plan members can insert doubts"
ON public.doubts FOR INSERT
WITH CHECK ( public.is_plan_member(plan_id) );

-- UPDATE: Only author
CREATE POLICY "Users can update their own doubts"
ON public.doubts FOR UPDATE
USING ( user_id = (SELECT auth.uid()) );

-- DELETE: Author OR Plan Owner
CREATE POLICY "Users or owners can delete doubts"
ON public.doubts FOR DELETE
USING ( 
  user_id = (SELECT auth.uid())
  OR 
  (SELECT auth.uid()) IN (SELECT owner_id FROM public.plans WHERE id = plan_id)
);

-- 6. Recreate Policies for 'likes'
-- SELECT: Plan members
CREATE POLICY "Plan members can view likes"
ON public.likes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = proposal_id
    AND public.is_plan_member(p.plan_id)
  )
);

-- ALL (Manage): Author only, must be plan member
CREATE POLICY "Members can manage their own likes"
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

-- 7. Recreate Policies for 'affiliate_listings'
-- SELECT: Active listings are public
CREATE POLICY "Public active affiliate listings are viewable"
ON public.affiliate_listings FOR SELECT
USING ( is_active = true );

-- ALL (Manage): Owner only
CREATE POLICY "Users can manage their own affiliate listings"
ON public.affiliate_listings FOR ALL
USING ( user_id = (SELECT auth.uid()) );

-- 8. Recreate Policies for 'listed_products'
-- SELECT: Active products are public
CREATE POLICY "Public active products are viewable"
ON public.listed_products FOR SELECT
USING ( is_active = true );

-- ALL (Manage): Business Owner only
CREATE POLICY "Agents can manage their own products"
ON public.listed_products FOR ALL
USING ( business_id = (SELECT auth.uid()) )
WITH CHECK ( business_id = (SELECT auth.uid()) );
