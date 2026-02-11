
-- booking_outbox table for reliable Google Sheets sync
CREATE TABLE public.booking_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  destination text NOT NULL DEFAULT 'google_sheets',
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  next_retry_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed'))
);

-- RLS
ALTER TABLE public.booking_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_outbox" ON public.booking_outbox FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "cs_manage_outbox" ON public.booking_outbox FOR ALL
  USING (is_cs()) WITH CHECK (is_cs());

-- Index for retry worker
CREATE INDEX idx_outbox_pending ON public.booking_outbox (status, next_retry_at) WHERE status IN ('pending', 'failed');

-- Trigger for updated_at
CREATE TRIGGER update_booking_outbox_updated_at
  BEFORE UPDATE ON public.booking_outbox
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
