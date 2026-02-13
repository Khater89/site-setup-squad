
-- Provider needs a PERMISSIVE SELECT policy on their assigned bookings
-- so that .update().select() can return the updated row.
-- Currently they only read via SECURITY DEFINER RPC, but direct update+select needs this.
CREATE POLICY "provider_read_own_bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (is_provider() AND assigned_provider_id = auth.uid());
