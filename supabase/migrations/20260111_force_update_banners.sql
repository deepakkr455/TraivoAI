-- Force update active listings to ensure we have data for all banner types
-- This is a 'nuclear option' to guarantee at least some rows match

-- 1. Ensure RLS is permissive for active listings
ALTER TABLE public.affiliate_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public active affiliate listings are viewable by everyone" ON public.affiliate_listings;
DROP POLICY IF EXISTS "Public read access" ON public.affiliate_listings;

CREATE POLICY "Public active affiliate listings are viewable by everyone"
ON public.affiliate_listings
FOR SELECT
USING (is_active = true);

-- 2. Force set banner types for testing visibility
-- Assign 'vertical-banner' to the first 5 active Viator listings
UPDATE public.affiliate_listings
SET banner_type = 'vertical-banner'
WHERE id IN (
  SELECT id FROM public.affiliate_listings 
  WHERE affiliate_source = 'viator' AND is_active = true
  LIMIT 5
);

-- Assign 'horizontal-banner' to the next 5 active Viator listings
UPDATE public.affiliate_listings
SET banner_type = 'horizontal-banner'
WHERE id IN (
  SELECT id FROM public.affiliate_listings 
  WHERE affiliate_source = 'viator' AND is_active = true 
  AND banner_type IS NULL
  LIMIT 5
);

-- Fallback: If no Viator listings, update ANY active listing just to show something
-- (Uncomment if needed, but risky for real data)
-- UPDATE public.affiliate_listings SET banner_type = 'vertical-banner' WHERE banner_type IS NULL AND is_active = true LIMIT 3;
