
-- =============================================
-- FIX 1: Restrict bookings INSERT to authenticated users
-- =============================================
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

CREATE POLICY "Authenticated users can create bookings"
ON public.bookings
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND customer_user_id = auth.uid());

-- =============================================
-- FIX 2: Restrict platform_settings to authenticated users only
-- (booking page needs fee % for display, so auth required, not admin-only)
-- =============================================
DROP POLICY IF EXISTS "Anyone can read settings" ON public.platform_settings;

CREATE POLICY "Authenticated users can read settings"
ON public.platform_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- =============================================
-- FIX 3: Server-side trigger to recalculate financial fields
-- Prevents price manipulation even if client sends bad values
-- =============================================
CREATE OR REPLACE FUNCTION public.calculate_booking_financials()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fee_percent numeric;
BEGIN
  -- Get current platform fee percentage
  SELECT platform_fee_percent INTO fee_percent
  FROM public.platform_settings
  WHERE id = 1;

  -- Validate subtotal is positive and reasonable
  IF NEW.subtotal <= 0 THEN
    RAISE EXCEPTION 'Booking subtotal must be positive';
  END IF;
  IF NEW.subtotal > 100000 THEN
    RAISE EXCEPTION 'Booking subtotal exceeds maximum allowed';
  END IF;

  -- Always recalculate financial fields server-side (override client values)
  NEW.platform_fee := ROUND(NEW.subtotal * (fee_percent / 100), 2);
  NEW.provider_payout := NEW.subtotal - NEW.platform_fee;

  RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_booking_financials_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_booking_financials();
