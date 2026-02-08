
-- Drop FK constraint on service_id
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_service_id_fkey;

-- Change service_id from uuid to text to support hardcoded service keys
ALTER TABLE public.bookings ALTER COLUMN service_id TYPE text USING service_id::text;
