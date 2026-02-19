-- Migration: Fix RLS Overlaps
-- Strategy: Split 'FOR ALL' policies into distinct INSERT, UPDATE, DELETE policies.
-- Consolidate 'FOR SELECT' policies to ensure only one policy applies per action/role.

-- 1. Dynamic Drop of existing overlapping policies
DO $$
DECLARE
  pol record;
  tables_to_clean text[] := ARRAY[
    'affiliate_listings', 
    'listed_products',
    'plans',
    'likes'
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

--------------------------------------------------------------------------------
-- 2. affiliate_listings
--------------------------------------------------------------------------------
-- SELECT: Public (active) OR Owner
CREATE POLICY "Public or owner view affiliate listings"
ON public.affiliate_listings FOR SELECT
USING ( 
    is_active = true 
    OR 
    user_id = (SELECT auth.uid()) 
);

-- INSERT: Owner only
CREATE POLICY "Owners insert affiliate listings"
ON public.affiliate_listings FOR INSERT
WITH CHECK ( user_id = (SELECT auth.uid()) );

-- UPDATE: Owner only
CREATE POLICY "Owners update affiliate listings"
ON public.affiliate_listings FOR UPDATE
USING ( user_id = (SELECT auth.uid()) );

-- DELETE: Owner only
CREATE POLICY "Owners delete affiliate listings"
ON public.affiliate_listings FOR DELETE
USING ( user_id = (SELECT auth.uid()) );

--------------------------------------------------------------------------------
-- 3. listed_products
--------------------------------------------------------------------------------
-- SELECT: Public (active) OR Owner
CREATE POLICY "Public or owner view listed products"
ON public.listed_products FOR SELECT
USING ( 
    is_active = true 
    OR 
    business_id = (SELECT auth.uid()) 
);

-- INSERT: active/business owner only
CREATE POLICY "Owners insert listed products"
ON public.listed_products FOR INSERT
WITH CHECK ( business_id = (SELECT auth.uid()) );

-- UPDATE: active/business owner only
CREATE POLICY "Owners update listed products"
ON public.listed_products FOR UPDATE
USING ( business_id = (SELECT auth.uid()) );

-- DELETE: active/business owner only
CREATE POLICY "Owners delete listed products"
ON public.listed_products FOR DELETE
USING ( business_id = (SELECT auth.uid()) );

--------------------------------------------------------------------------------
-- 4. plans
--------------------------------------------------------------------------------
-- SELECT: Plan Member (this function already includes the owner)
CREATE POLICY "Members view plans"
ON public.plans FOR SELECT
USING ( public.is_plan_member(id) );

-- INSERT: Owner
CREATE POLICY "Owners insert plans"
ON public.plans FOR INSERT
WITH CHECK ( owner_id = (SELECT auth.uid()) );

-- UPDATE: Owner
CREATE POLICY "Owners update plans"
ON public.plans FOR UPDATE
USING ( owner_id = (SELECT auth.uid()) )
WITH CHECK ( owner_id = (SELECT auth.uid()) );

-- DELETE: Owner
CREATE POLICY "Owners delete plans"
ON public.plans FOR DELETE
USING ( owner_id = (SELECT auth.uid()) );

--------------------------------------------------------------------------------
-- 5. likes
--------------------------------------------------------------------------------
-- SELECT: Plan Members
CREATE POLICY "Plan members view likes"
ON public.likes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = proposal_id
    AND public.is_plan_member(p.plan_id)
  )
);

-- INSERT: Author (must be member)
CREATE POLICY "Members insert likes"
ON public.likes FOR INSERT
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = proposal_id
    AND public.is_plan_member(p.plan_id)
  )
);

-- UPDATE: Author (must be member)
CREATE POLICY "Members update likes"
ON public.likes FOR UPDATE
USING (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = proposal_id
    AND public.is_plan_member(p.plan_id)
  )
);

-- DELETE: Author (must be member)
CREATE POLICY "Members delete likes"
ON public.likes FOR DELETE
USING (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = proposal_id
    AND public.is_plan_member(p.plan_id)
  )
);
