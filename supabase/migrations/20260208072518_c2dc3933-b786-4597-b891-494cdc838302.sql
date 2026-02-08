
-- Allow providers to read NEW unassigned bookings (for self-assign)
CREATE POLICY "Providers can read new unassigned bookings"
ON public.bookings
FOR SELECT
USING (
  status = 'NEW' 
  AND assigned_provider_id IS NULL 
  AND is_provider()
);
