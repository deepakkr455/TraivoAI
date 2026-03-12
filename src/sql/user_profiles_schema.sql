-- WanderChat Database Schema: User Personalization
-- Note: Currently we utilize Supabase Auth user_metadata for simplicity, 
-- but this schema represents the robust profile-based implementation.

-- 1.-- Existing Profiles Table (Aligned with actual Supabase schema)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid not null PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text not null,
  full_name text null,
  user_type text null CHECK (user_type IN ('agent', 'agency', 'affiliate_partner', 'other')),
  company_name text null,
  company_size text null,
  company_website text null,
  instagram_page_id text null,
  facebook_id text null,
  phone_number text null,
  alternative_number text null,
  city text null,
  state text null,
  
  -- Additions for Agent Onboarding & Verification
  avatar_url TEXT NULL, -- Used for Agent Logo
  onboarding_status TEXT DEFAULT 'pending', -- pending, basic_submitted, basic_verified, id_verified
  tc_accepted BOOLEAN DEFAULT false,
  tc_accepted_at TIMESTAMP WITH TIME ZONE NULL,
  id_verification_details JSONB DEFAULT '{"links": []}'::JSONB,
  
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

-- Safe Alter Script (Run this in Supabase SQL Editor if table already exists)
/*
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS tc_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tc_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS id_verification_details JSONB DEFAULT '{"links": []}'::JSONB;
*/

-- 2. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 3. Trigger for new user signup
-- Automatically create a profile row when a new user signs up via Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email,
    full_name, 
    user_type,
    company_name,
    company_size,
    company_website,
    instagram_page_id,
    facebook_id,
    phone_number,
    alternative_number,
    city,
    state
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Traivo User'),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'other'),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_size', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_website', ''),
    COALESCE(NEW.raw_user_meta_data->>'instagram_page_id', ''),
    COALESCE(NEW.raw_user_meta_data->>'facebook_id', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'alternative_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'state', '')
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error or just allow sign-up to continue without a profile row
  -- In a production environment, you might want more complex logging here.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Sync Personalization Helper (Optional but Recommended)
-- If using raw metadata, you can access it via auth.users.raw_user_meta_data->'personalization'
-- This SQL documented above is the "best practice" for scaling beyond simple metadata.
