-- Create user_personalizations table with user preferred syntax
CREATE TABLE IF NOT EXISTS public.user_personalizations (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  user_id uuid NOT NULL,
  referral_source text NULL,
  city text NULL,
  state text NULL,
  interests jsonb NULL DEFAULT '[]'::jsonb,
  travel_frequency text NULL,
  travel_habits text NULL,
  budget text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT user_personalizations_pkey PRIMARY KEY (id),
  CONSTRAINT user_personalizations_user_id_key UNIQUE (user_id),
  CONSTRAINT user_personalizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Add indexes with tablespace
CREATE INDEX IF NOT EXISTS idx_user_personalizations_user_id ON public.user_personalizations USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_personalizations_state ON public.user_personalizations USING btree (state) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.user_personalizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_personalizations' AND policyname = 'Users can manage their own personalization'
    ) THEN
        CREATE POLICY "Users can manage their own personalization" 
        ON public.user_personalizations 
        FOR ALL 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_personalizations_updated_at ON public.user_personalizations;
CREATE TRIGGER update_user_personalizations_updated_at 
    BEFORE UPDATE ON public.user_personalizations 
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
