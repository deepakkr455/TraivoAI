-- Add banner_type column
ALTER TABLE public.affiliate_listings
ADD COLUMN IF NOT EXISTS banner_type text;

-- Update for horizontal banners
UPDATE public.affiliate_listings
SET banner_type = 'horizontal-banner'
WHERE affiliate_source = 'viator'
  AND embed_code LIKE '%data-campaign="blog-page-traction-hrz"%';

-- Update for vertical banners
UPDATE public.affiliate_listings
SET banner_type = 'vertical-banner'
WHERE affiliate_source = 'viator'
  AND embed_code LIKE '%data-campaign="blog-page-traction-vrc"%';

-- Update for square banners
UPDATE public.affiliate_listings
SET banner_type = 'square-banner'
WHERE affiliate_source = 'viator'
  AND embed_code LIKE '%data-campaign="best-travel-deals-sqr"%';
