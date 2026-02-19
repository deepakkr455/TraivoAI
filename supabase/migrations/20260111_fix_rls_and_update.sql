-- 1. Enable RLS on the table (good practice to ensure it's on)
ALTER TABLE public.affiliate_listings ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policy if it exists to avoid conflicts (safely)
DROP POLICY IF EXISTS "Public active affiliate listings are viewable by everyone" ON public.affiliate_listings;
DROP POLICY IF EXISTS "Public read access" ON public.affiliate_listings;

-- 3. Create a policy that allows anyone (anon and authenticated) to read ACTIVE listings
CREATE POLICY "Public active affiliate listings are viewable by everyone"
ON public.affiliate_listings
FOR SELECT
USING (is_active = true);

-- 4. Re-run key updates with potentially broader matching (case insensitive) just in case
UPDATE public.affiliate_listings
SET banner_type = 'horizontal-banner'
WHERE affiliate_source = 'viator'
  AND embed_code ILIKE '%blog-page-traction-hrz%';

UPDATE public.affiliate_listings
SET banner_type = 'vertical-banner'
WHERE affiliate_source = 'viator'
  AND embed_code ILIKE '%blog-page-traction-vrc%';

UPDATE public.affiliate_listings
SET banner_type = 'square-banner'
WHERE affiliate_source = 'viator'
  AND embed_code ILIKE '%best-travel-deals-sqr%';
