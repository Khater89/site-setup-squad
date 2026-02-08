
-- Allow providers to self-assign NEW unassigned bookings
CREATE POLICY "Providers can self-assign new bookings"
ON public.bookings
FOR UPDATE
USING (
  status = 'NEW'
  AND assigned_provider_id IS NULL
  AND is_provider()
)
WITH CHECK (
  assigned_provider_id = auth.uid()
  AND status = 'ASSIGNED'
  AND is_provider()
);
