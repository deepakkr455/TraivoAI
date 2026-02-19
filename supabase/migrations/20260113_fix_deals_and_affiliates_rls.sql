-- Migration: Fix Deals and Affiliates RLS Policies
-- Objective: Allow public SELECT access for active listings and ensure owners can manage them.

-- 1. listed_products
ALTER TABLE public.listed_products ENABLE ROW LEVEL SECURITY;

-- Drop existing restricted policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Business owners can insert their own products" ON public.listed_products;
DROP POLICY IF EXISTS "Public active products are viewable by everyone" ON public.listed_products;
DROP POLICY IF EXISTS "Agents can manage their own products" ON public.listed_products;

-- Allow public read access to active products
CREATE POLICY "Public active products are viewable by everyone"
ON public.listed_products
FOR SELECT
USING (is_active = true);

-- Allow agents/business owners to manage their own products (ALL actions)
-- Note: business_id is the UUID of the business owner (auth.uid()) or their business record
CREATE POLICY "Agents can manage their own products"
ON public.listed_products
FOR ALL
USING (auth.uid() = business_id);


-- 2. affiliate_listings
ALTER TABLE public.affiliate_listings ENABLE ROW LEVEL SECURITY;

-- Drop existing restricted policies
DROP POLICY IF EXISTS "Users can manage their own affiliate listings" ON public.affiliate_listings;
DROP POLICY IF EXISTS "Public active affiliate listings are viewable by everyone" ON public.affiliate_listings;

-- Allow public read access to active affiliate listings
CREATE POLICY "Public active affiliate listings are viewable by everyone"
ON public.affiliate_listings
FOR SELECT
USING (is_active = true);

-- Allow owners to manage their own listings (ALL actions)
CREATE POLICY "Users can manage their own affiliate listings"
ON public.affiliate_listings
FOR ALL
USING (auth.uid() = user_id);
