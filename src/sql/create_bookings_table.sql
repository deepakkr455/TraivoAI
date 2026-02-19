-- Migration: Create bookings table for Agent Dashboard
-- This table tracks confirmed bookings for products listed by agents.

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL, -- The Agent/Business who owns the product
    customer_id UUID,          -- References auth.users(id) of the traveler
    product_id UUID REFERENCES public.listed_products(id) ON DELETE SET NULL,
    
    customer_name TEXT NOT NULL,
    customer_avatar TEXT,      -- Optional avatar URL for UI
    product_title TEXT NOT NULL,
    date DATE NOT NULL,        -- The start date of the trip/booking
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
    pax INTEGER DEFAULT 1,
    
    commission_rate NUMERIC(5, 2) DEFAULT 0,  -- Percentage (e.g., 5.00)
    commission_amount NUMERIC(10, 2) DEFAULT 0,
    commission_status TEXT DEFAULT 'unpaid' CHECK (commission_status IN ('paid', 'pending', 'unpaid')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 1. Agents can see bookings for their business
CREATE POLICY "Agents can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = business_id);

-- 2. Agents can update their own bookings
CREATE POLICY "Agents can update own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = business_id);

-- 3. Customers can see their own bookings (if customer_id is set)
CREATE POLICY "Customers can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = customer_id);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_bookings_business ON public.bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_bookings_product ON public.bookings(product_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);

-- Trigger for updated_at
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
