-- WanderChat Database Schema: User Personalization
-- Note: Currently we utilize Supabase Auth user_metadata for simplicity, 
-- but this schema represents the robust profile-based implementation.

-- 1. Profiles Table (Extends Auth.Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  personalization JSONB DEFAULT '{
    "tripTypes": "",
    "location": {"country": "India", "state": ""},
    "excitement": "",
    "pace": "",
    "budget": ""
  }'::JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, personalization)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->'personalization', '{}'::JSONB)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Sync Personalization Helper (Optional but Recommended)
-- If using raw metadata, you can access it via auth.users.raw_user_meta_data->'personalization'
-- This SQL documented above is the "best practice" for scaling beyond simple metadata.
