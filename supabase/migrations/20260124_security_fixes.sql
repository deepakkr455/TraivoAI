-- Fix mutable search path for update_updated_at_column function
-- This function is used as a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Secure the Allow anonymous interaction tracking policy
-- Drop the existing permissive policy that was flagged as insecure
DROP POLICY IF EXISTS "Allow anonymous interaction tracking" ON public.product_interactions;

-- Create a new restricted policy that validates the product exists
-- This prevents inserting interactions for non-existent products while still allowing anonymous tracking
CREATE POLICY "Allow anonymous interaction tracking"
ON public.product_interactions
FOR INSERT
WITH CHECK (
    -- Verify the product exists to prevent spam/invalid data
    EXISTS (
        SELECT 1 FROM public.listed_products lp
        WHERE lp.id = product_id
    )
);
