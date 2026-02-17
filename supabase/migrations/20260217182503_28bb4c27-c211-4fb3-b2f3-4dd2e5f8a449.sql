
-- Add spread pricing and deal tracking columns
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS provider_share numeric,
  ADD COLUMN IF NOT EXISTS deal_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS deal_confirmed_by text;

-- Drop the auto-commission trigger and function (moving to manual spread model)
DROP TRIGGER IF EXISTS calculate_booking_financials_trigger ON public.bookings;
DROP FUNCTION IF EXISTS public.calculate_booking_financials() CASCADE;
