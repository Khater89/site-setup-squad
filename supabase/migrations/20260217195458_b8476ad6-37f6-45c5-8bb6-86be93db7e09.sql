
-- 1. Staff notifications table for in-app alerts
CREATE TABLE public.staff_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_role text NOT NULL DEFAULT 'admin',
  title text NOT NULL,
  body text,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  provider_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_notifications" ON public.staff_notifications
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "cs_read_notifications" ON public.staff_notifications
  FOR SELECT USING (is_cs());

CREATE POLICY "cs_update_notifications" ON public.staff_notifications
  FOR UPDATE USING (is_cs());

CREATE POLICY "system_insert_notifications" ON public.staff_notifications
  FOR INSERT WITH CHECK (true);

-- 2. Modify debt trigger: record on ACCEPTED, adjust on COMPLETED
CREATE OR REPLACE FUNCTION public.record_completion_debt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  client_total numeric;
  provider_total numeric;
  spread numeric;
  initial_spread numeric;
  delta numeric;
  existing_debt numeric;
BEGIN
  -- ══ Case 1: ACCEPTED — record initial debt (base spread) ══
  IF NEW.status = 'ACCEPTED' AND OLD.status <> 'ACCEPTED' THEN
    IF NEW.agreed_price IS NOT NULL AND NEW.provider_share IS NOT NULL AND NEW.assigned_provider_id IS NOT NULL THEN
      initial_spread := NEW.agreed_price - NEW.provider_share;
      IF initial_spread > 0 THEN
        INSERT INTO public.provider_wallet_ledger (provider_id, amount, reason, booking_id)
        VALUES (NEW.assigned_provider_id, -initial_spread, 'platform_fee', NEW.id);
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- ══ Case 2: COMPLETED — adjust debt for extra hours ══
  IF NEW.status = 'COMPLETED' AND OLD.status <> 'COMPLETED' THEN
    IF NEW.assigned_provider_id IS NULL
       OR NEW.agreed_price IS NULL
       OR NEW.provider_share IS NULL
       OR NEW.actual_duration_minutes IS NULL THEN
      RETURN NEW;
    END IF;

    -- Calculate escalating totals
    client_total := public.calc_escalating_price(NEW.agreed_price, NEW.actual_duration_minutes);
    provider_total := public.calc_escalating_price(NEW.provider_share, NEW.actual_duration_minutes);
    spread := client_total - provider_total;

    -- Update the booking with final calculated total
    NEW.calculated_total := client_total;

    -- Get already-recorded debt from acceptance
    SELECT COALESCE(SUM(ABS(amount)), 0) INTO existing_debt
    FROM public.provider_wallet_ledger
    WHERE provider_id = NEW.assigned_provider_id
      AND booking_id = NEW.id
      AND reason = 'platform_fee';

    -- Only record the delta (extra hours spread)
    delta := spread - existing_debt;
    IF delta > 0 THEN
      INSERT INTO public.provider_wallet_ledger (provider_id, amount, reason, booking_id)
      VALUES (NEW.assigned_provider_id, -delta, 'platform_fee', NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Recreate trigger to also fire on ACCEPTED
DROP TRIGGER IF EXISTS trg_record_completion_debt ON public.bookings;
CREATE TRIGGER trg_record_completion_debt
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.record_completion_debt();
