
-- Add missing columns to bookings table for provider workflow
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS completed_by uuid;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS close_out_note text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS close_out_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS rejected_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS rejected_by uuid;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reject_reason text;

-- Add REJECTED to status check constraint if not already there
-- First drop existing constraint and recreate with REJECTED included
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('NEW', 'CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'));
