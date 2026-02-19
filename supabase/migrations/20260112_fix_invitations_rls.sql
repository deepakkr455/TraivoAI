-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Plan owners can create invitations" ON public.invitations;
DROP POLICY IF EXISTS "Plan owners can view invitations" ON public.invitations;
DROP POLICY IF EXISTS "Plan owners can delete invitations" ON public.invitations;

-- Policy to allow plan owners to insert invitations
CREATE POLICY "Plan owners can create invitations"
ON public.invitations
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT owner_id FROM public.plans WHERE id = plan_id
  )
);

-- Policy to allow plan owners to view invitations
CREATE POLICY "Plan owners can view invitations"
ON public.invitations
FOR SELECT
USING (
  auth.uid() IN (
    SELECT owner_id FROM public.plans WHERE id = plan_id
  )
);

-- Policy to allow plan owners to delete invitations
CREATE POLICY "Plan owners can delete invitations"
ON public.invitations
FOR DELETE
USING (
  auth.uid() IN (
    SELECT owner_id FROM public.plans WHERE id = plan_id
  )
);
