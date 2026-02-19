-- Create password_reset_otps table
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    used BOOLEAN DEFAULT false
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON public.password_reset_otps(email);

-- Enable RLS
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Only authenticated service role should access this table (Edge Functions)
-- We don't need user policies as users don't access this directly.
CREATE POLICY "Service role only access" 
ON public.password_reset_otps 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
