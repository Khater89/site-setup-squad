
-- Fix: provider_update_own_bookings is RESTRICTIVE but there's no PERMISSIVE policy,
-- so all provider updates are silently denied. Recreate as PERMISSIVE.
DROP POLICY IF EXISTS "provider_update_own_bookings" ON public.bookings;

CREATE POLICY "provider_update_own_bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (is_provider() AND assigned_provider_id = auth.uid())
WITH CHECK (is_provider() AND assigned_provider_id = auth.uid());
