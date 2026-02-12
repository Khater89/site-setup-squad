
-- 1. Allow providers to update their own assigned bookings (status, accepted_at only)
CREATE POLICY "provider_update_own_bookings"
ON public.bookings
FOR UPDATE
USING (is_provider() AND assigned_provider_id = auth.uid())
WITH CHECK (is_provider() AND assigned_provider_id = auth.uid());

-- 2. Create booking_history table for order lifecycle tracking
CREATE TABLE public.booking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  action text NOT NULL,
  performed_by uuid NOT NULL,
  performer_role text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_history" ON public.booking_history FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "cs_all_history" ON public.booking_history FOR ALL USING (is_cs()) WITH CHECK (is_cs());
CREATE POLICY "provider_read_own_history" ON public.booking_history FOR SELECT USING (
  is_provider() AND booking_id IN (SELECT id FROM public.bookings WHERE assigned_provider_id = auth.uid())
);
CREATE POLICY "provider_insert_history" ON public.booking_history FOR INSERT WITH CHECK (
  is_provider() AND performed_by = auth.uid()
);

CREATE INDEX idx_booking_history_booking_id ON public.booking_history(booking_id);
