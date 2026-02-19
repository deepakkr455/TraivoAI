-- Migration: Fix Trip Invitation Access
-- Restores access for invited members and unauthenticated users with valid tokens.
-- Overrides restrictive policies from recent RLS optimizations.

-- 1. Redefine is_plan_member to be more inclusive
CREATE OR REPLACE FUNCTION public.is_plan_member(p_plan_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 2. Restore plans SELECT policy
DROP POLICY IF EXISTS "Users can view their own or joined plans" ON public.plans;
CREATE POLICY "Users can view their own or joined plans"
ON public.plans
FOR SELECT
USING ( public.is_plan_member(id) );

-- 3. Restore/Update invitations policies
-- We drop both possible names from previous migrations
DROP POLICY IF EXISTS "Plan owners can view invitations" ON public.invitations;
DROP POLICY IF EXISTS "Viewable by owners and invitees" ON public.invitations;
DROP POLICY IF EXISTS "Viewable by owners, invitees, or via token" ON public.invitations;

CREATE POLICY "Viewable by owners, invitees, or via token"
ON public.invitations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
  OR
  LOWER(invited_email) = LOWER((SELECT auth.email()))
  OR
  EXISTS (
    SELECT 1 FROM public.invitation_tokens
    WHERE invitation_id = public.invitations.id
    AND expires_at > now()
  )
);

DROP POLICY IF EXISTS "Invitees can update their own invitations" ON public.invitations;
CREATE POLICY "Invitees can update their own invitations"
ON public.invitations
FOR UPDATE
USING (
  LOWER(invited_email) = LOWER((SELECT auth.email()))
  OR
  EXISTS (
    SELECT 1 FROM public.invitation_tokens
    WHERE invitation_id = public.invitations.id
    AND expires_at > now()
  )
)
WITH CHECK (
  status IN ('accepted', 'declined')
);

-- 4. Ensure invitation_tokens is public read
DROP POLICY IF EXISTS "Allow public read invitation_tokens" ON public.invitation_tokens;
CREATE POLICY "Allow public read invitation_tokens" 
ON public.invitation_tokens
FOR SELECT 
USING (true);

-- 5. Restore/Update plan_members policies
DROP POLICY IF EXISTS "Users can manage their own plan memberships" ON public.plan_members;
DROP POLICY IF EXISTS "Members can view their own memberships" ON public.plan_members;
DROP POLICY IF EXISTS "Plan owners can view all members" ON public.plan_members;
DROP POLICY IF EXISTS "Plan owners can remove members" ON public.plan_members;

-- Allow members to see their own status
CREATE POLICY "Members can view their own memberships"
ON public.plan_members
FOR SELECT
USING ( (SELECT auth.uid()) = user_id );

-- Allow owners to see all members of their plan
CREATE POLICY "Plan owners can view all members"
ON public.plan_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
);

-- Allow owners to remove members
CREATE POLICY "Plan owners can remove members"
ON public.plan_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
);

-- 5. Grant necessary permissions (redundant but safe)
GRANT EXECUTE ON FUNCTION public.is_plan_member(uuid) TO authenticated, anon, service_role;
