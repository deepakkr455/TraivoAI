-- Migration: Add missing RLS policies
-- Addressing "RLS Enabled No Policy" warnings for:
-- public.bookings, public.businesses, public.customer_saved_deals, public.inquiries,
-- public.invitation_tokens, public.likes, public.products

-- 1. bookings
-- Enable RLS just in case (redundant if already enabled, but safe)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create a booking (customers)
CREATE POLICY "Allow public insert to bookings" ON public.bookings
    FOR INSERT WITH CHECK (true);

-- Allow agents (business owners) to view their own bookings
-- Assuming business_id matches auth.uid OR business_id links to businesses table where owner is auth.uid
-- Since we don't have a clear owner link in businesses schema, we'll assume a direct ID match or just allow INSERT for now.
-- BUT, we definitely need a SELECT policy or no one can see them.
-- Strategy: Allow if auth.uid() = business_id (Agent Model)
CREATE POLICY "Allow agents view their bookings" ON public.bookings
    FOR SELECT USING ( auth.uid() = business_id );

-- 2. businesses
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Public read access (profiles are public)
CREATE POLICY "Allow public read businesses" ON public.businesses
    FOR SELECT USING (true);

-- Allow owner to update/delete
-- Assuming id is the user_id (Agent's Profile)
CREATE POLICY "Allow owner manage business" ON public.businesses
    FOR ALL USING ( auth.uid() = id );

-- 3. customer_saved_deals
ALTER TABLE public.customer_saved_deals ENABLE ROW LEVEL SECURITY;

-- User owns their saved deals
CREATE POLICY "Users manage own saved deals" ON public.customer_saved_deals
    FOR ALL USING ( auth.uid() = user_id );

-- 4. inquiries (Legacy/Agent table)
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Public insert (listing inquiry)
CREATE POLICY "Allow public insert inquiries" ON public.inquiries
    FOR INSERT WITH CHECK (true);

-- Agents view inquiries for their business
CREATE POLICY "Agents view own inquiries" ON public.inquiries
    FOR SELECT USING ( auth.uid() = business_id );

-- 5. invitation_tokens
ALTER TABLE public.invitation_tokens ENABLE ROW LEVEL SECURITY;

-- Public read (for validating tokens by anyone with the link)
CREATE POLICY "Allow public read invitation_tokens" ON public.invitation_tokens
    FOR SELECT USING (true);

-- System/Authenticated users create tokens (via invitations table link usually)
-- But triggers/server-side might bypass RLS. If client-side creates calls:
CREATE POLICY "Allow authenticated manage tokens" ON public.invitation_tokens
    FOR ALL TO authenticated USING (true);

-- 6. likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Public read (to see counts)
CREATE POLICY "Allow public read likes" ON public.likes
    FOR SELECT USING (true);

-- Users manage their own likes
CREATE POLICY "Users manage own likes" ON public.likes
    FOR ALL USING ( auth.uid() = user_id );

-- 7. products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Allow public read products" ON public.products
    FOR SELECT USING (true);

-- Agents manage their products
CREATE POLICY "Agents manage own products" ON public.products
    FOR ALL USING ( auth.uid() = business_id );
