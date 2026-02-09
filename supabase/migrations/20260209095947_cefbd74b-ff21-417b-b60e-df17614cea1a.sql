
-- Drop the old constraint and add updated one with ACCEPTED and IN_PROGRESS
ALTER TABLE public.bookings DROP CONSTRAINT bookings_status_check;

ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
CHECK (status = ANY (ARRAY['NEW'::text, 'CONFIRMED'::text, 'ASSIGNED'::text, 'ACCEPTED'::text, 'IN_PROGRESS'::text, 'COMPLETED'::text, 'CANCELLED'::text]));
