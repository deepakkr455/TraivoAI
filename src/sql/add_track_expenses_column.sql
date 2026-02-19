-- Add track_expenses field to plans table
-- This tracks whether the admin chose to enable expense tracking for the trip

ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS track_expenses BOOLEAN DEFAULT NULL;

-- NULL means not yet decided
-- TRUE means admin chose to track expenses
-- FALSE means admin skipped expense tracking
