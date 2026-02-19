-- Enable RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Plan members can view proposals" ON public.proposals;
DROP POLICY IF EXISTS "Plan members can insert proposals" ON public.proposals;
DROP POLICY IF EXISTS "Plan owners can insert proposals" ON public.proposals;
DROP POLICY IF EXISTS "Plan members can update proposals" ON public.proposals;
DROP POLICY IF EXISTS "Plan owners can update proposals" ON public.proposals;
DROP POLICY IF EXISTS "Plan members can delete proposals" ON public.proposals;
DROP POLICY IF EXISTS "Plan owners can delete proposals" ON public.proposals;

-- Policy to allow plan members (including owners) to view proposals
CREATE POLICY "Plan members can view proposals"
ON public.proposals
FOR SELECT
USING (
  public.is_plan_member(plan_id)
);

-- Policy to allow ONLY plan owners to insert proposals
CREATE POLICY "Plan owners can insert proposals"
ON public.proposals
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT owner_id FROM public.plans WHERE id = plan_id
  )
);

-- Policy to allow ONLY plan owners to update proposals
CREATE POLICY "Plan owners can update proposals"
ON public.proposals
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT owner_id FROM public.plans WHERE id = plan_id
  )
);

-- Policy to allow ONLY plan owners to delete proposals
CREATE POLICY "Plan owners can delete proposals"
ON public.proposals
FOR DELETE
USING (
  auth.uid() IN (
    SELECT owner_id FROM public.plans WHERE id = plan_id
  )
);
