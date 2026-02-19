-- 1. Redefine is_plan_member as SECURITY DEFINER
-- This allows the function to bypass RLS on child tables (like plan_members) 
-- when used inside a policy for plans, and also centralizes the membership logic.
CREATE OR REPLACE FUNCTION public.is_plan_member(p_plan_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
BEGIN
  v_user_id := (SELECT auth.uid());
  v_user_email := (SELECT auth.email());

  -- If not logged in, no access (since all these tables are private)
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    -- Case 1: User is the owner of the plan
    SELECT 1 FROM public.plans WHERE id = p_plan_id AND owner_id = v_user_id
    UNION
    -- Case 2: User is explicitly a member (joined)
    SELECT 1 FROM public.plan_members WHERE plan_id = p_plan_id AND user_id = v_user_id
    UNION
    -- Case 3: User has a pending invitation for their current email
    SELECT 1 FROM public.invitations 
    WHERE plan_id = p_plan_id 
    AND invited_email = LOWER(v_user_email) 
    AND status = 'pending'
  );
END;
$$;

-- 2. Update RLS policies for 'plans' table
-- We need to ensure that the policy doesn't cause infinite recursion if it calls is_plan_member
-- which queries plans. However, since the function is SECURITY DEFINER, it bypasses RLS
-- when it executes its internal queries.

DROP POLICY IF EXISTS "Users can manage their own plans" ON public.plans;
DROP POLICY IF EXISTS "Users can view their own or joined plans" ON public.plans;

-- Policy for general access (SELECT)
CREATE POLICY "Users can view their own or joined plans"
ON public.plans
FOR SELECT
USING ( public.is_plan_member(id) );

-- Policy for modifications (INSERT/UPDATE/DELETE)
-- Usually only owners or specific members can modify. For now, keep it restricted to owners
-- or anyone who passes is_plan_member if they are allowed to edit (collaboration).
-- Since 'is_plan_member' now includes invited users (pending), they shouldn't necessarily EDIT yet.
-- But for view access, it's perfect.
CREATE POLICY "Owners can manage plans"
ON public.plans
FOR ALL
USING ( (SELECT auth.uid()) = owner_id );


-- 3. Update RLS policies for 'invitations' table
-- Invited users need to see their own invitations to accept them.
DROP POLICY IF EXISTS "Plan owners can view invitations" ON public.invitations;
CREATE POLICY "Viewable by owners and invitees"
ON public.invitations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
  OR
  LOWER(invited_email) = LOWER((SELECT auth.email()))
);


-- 4. Update RLS policies for 'plan_members' table
-- Members should be able to see who else is in the trip.
DROP POLICY IF EXISTS "Users can manage their own plan memberships" ON public.plan_members;
CREATE POLICY "Viewable by owner and members"
ON public.plan_members
FOR SELECT
USING ( public.is_plan_member(plan_id) );

CREATE POLICY "Users manage own membership"
ON public.plan_members
FOR ALL
USING ( (SELECT auth.uid()) = user_id );

-- 5. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_plan_member(uuid) TO authenticated, service_role;
