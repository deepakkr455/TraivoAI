-- SQL Migration: Add package_type to listings

-- 1. Add package_type to affiliate_listings
ALTER TABLE public.affiliate_listings 
ADD COLUMN IF NOT EXISTS package_type TEXT;

-- 2. Ensure package_type is present in listed_products (if not already)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listed_products' AND column_name='package_type') THEN
        ALTER TABLE public.listed_products ADD COLUMN package_type TEXT;
    END IF;
END $$;
