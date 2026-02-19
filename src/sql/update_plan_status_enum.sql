-- Allow new statuses in the plan_status enum
ALTER TYPE public.plan_status ADD VALUE IF NOT EXISTS 'invite';
ALTER TYPE public.plan_status ADD VALUE IF NOT EXISTS 'collaboration';
ALTER TYPE public.plan_status ADD VALUE IF NOT EXISTS 'journey-started';
ALTER TYPE public.plan_status ADD VALUE IF NOT EXISTS 'expense';
ALTER TYPE public.plan_status ADD VALUE IF NOT EXISTS 'concluded';
