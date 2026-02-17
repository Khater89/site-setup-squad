
-- Function to calculate escalating price
CREATE OR REPLACE FUNCTION public.calc_escalating_price(base_price numeric, duration_minutes integer)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  hours integer;
BEGIN
  IF base_price IS NULL OR duration_minutes IS NULL THEN RETURN NULL; END IF;
  hours := GREATEST(1, CEIL(duration_minutes::numeric / 60));
  RETURN base_price + (base_price * 0.5 * GREATEST(0, hours - 1));
END;
$$;

-- Trigger function: auto-record platform spread as provider debt on COMPLETED
CREATE OR REPLACE FUNCTION public.record_completion_debt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  client_total numeric;
  provider_total numeric;
  spread numeric;
BEGIN
  -- Only fire when status transitions to COMPLETED
  IF NEW.status <> 'COMPLETED' OR OLD.status = 'COMPLETED' THEN
    RETURN NEW;
  END IF;

  -- Guard: need provider, pricing, and duration
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

  -- Only record debt if spread > 0
  IF spread > 0 THEN
    INSERT INTO public.provider_wallet_ledger (provider_id, amount, reason, booking_id)
    VALUES (NEW.assigned_provider_id, -spread, 'platform_fee', NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger (BEFORE UPDATE so we can modify NEW)
CREATE TRIGGER trg_record_completion_debt
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.record_completion_debt();
