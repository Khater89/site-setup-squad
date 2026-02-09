
-- =============================================
-- Guest Booking + Privacy Model + Matching
-- =============================================

-- 1. Add columns to bookings for guest booking and privacy
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS client_address_text TEXT,
  ADD COLUMN IF NOT EXISTS client_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS client_lng NUMERIC,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reveal_contact_allowed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS contact_revealed_at TIMESTAMPTZ;

-- 2. Add lat/lng to profiles for provider geolocation
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lat NUMERIC,
  ADD COLUMN IF NOT EXISTS lng NUMERIC;

-- 3. Auto-generate human-friendly booking numbers (MFN-2026-000001)
CREATE SEQUENCE IF NOT EXISTS public.booking_number_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_number := 'MFN-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(nextval('public.booking_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_booking_number
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.booking_number IS NULL)
  EXECUTE FUNCTION public.generate_booking_number();

-- 4. Data access log for privacy compliance
CREATE TABLE public.data_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  accessed_by UUID NOT NULL,
  accessor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.data_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read access logs" ON public.data_access_log
  FOR SELECT USING (is_admin());

CREATE POLICY "CS can read access logs" ON public.data_access_log
  FOR SELECT USING (is_cs());

CREATE POLICY "Authenticated can insert logs" ON public.data_access_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Haversine distance function (returns km)
CREATE OR REPLACE FUNCTION public.haversine_distance(
  lat1 NUMERIC, lng1 NUMERIC, lat2 NUMERIC, lng2 NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  R NUMERIC := 6371;
  dlat NUMERIC;
  dlng NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
    RETURN NULL;
  END IF;
  dlat := RADIANS(lat2 - lat1);
  dlng := RADIANS(lng2 - lng1);
  a := SIN(dlat / 2) ^ 2 + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlng / 2) ^ 2;
  c := 2 * ATAN2(SQRT(a), SQRT(1 - a));
  RETURN ROUND(R * c, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- 6. Find nearest approved providers within radius
CREATE OR REPLACE FUNCTION public.find_nearest_providers(
  _lat NUMERIC,
  _lng NUMERIC,
  _limit INT DEFAULT 10
) RETURNS TABLE (
  provider_id UUID,
  full_name TEXT,
  city TEXT,
  distance_km NUMERIC,
  available_now BOOLEAN,
  phone TEXT,
  role_type TEXT,
  experience_years INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.user_id,
    p.full_name,
    p.city,
    public.haversine_distance(_lat, _lng, p.lat, p.lng),
    COALESCE(p.available_now, false),
    p.phone,
    p.role_type,
    p.experience_years
  FROM public.profiles p
  WHERE p.provider_status = 'approved'
    AND COALESCE(p.profile_completed, false) = TRUE
    AND p.lat IS NOT NULL AND p.lng IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'provider')
    AND public.haversine_distance(_lat, _lng, p.lat, p.lng) <= COALESCE(p.radius_km, 20)
  ORDER BY public.haversine_distance(_lat, _lng, p.lat, p.lng) ASC
  LIMIT _limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 7. Privacy-safe function for providers to fetch bookings
-- Masks sensitive data (phone, address, notes) until provider accepts
CREATE OR REPLACE FUNCTION public.get_provider_bookings()
RETURNS TABLE (
  id UUID,
  booking_number TEXT,
  service_id TEXT,
  city TEXT,
  scheduled_at TIMESTAMPTZ,
  status TEXT,
  provider_payout NUMERIC,
  subtotal NUMERIC,
  assigned_provider_id UUID,
  assigned_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  customer_display_name TEXT,
  customer_phone TEXT,
  client_address_text TEXT,
  client_lat NUMERIC,
  client_lng NUMERIC,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.booking_number,
    b.service_id,
    b.city,
    b.scheduled_at,
    b.status,
    b.provider_payout,
    b.subtotal,
    b.assigned_provider_id,
    b.assigned_at,
    b.accepted_at,
    b.created_at,
    -- Privacy: full name only after acceptance
    CASE
      WHEN b.accepted_at IS NOT NULL AND b.assigned_provider_id = auth.uid()
      THEN b.customer_name
      ELSE split_part(b.customer_name, ' ', 1)
    END,
    -- Privacy: phone only after acceptance
    CASE
      WHEN b.accepted_at IS NOT NULL AND b.assigned_provider_id = auth.uid()
      THEN b.customer_phone
      ELSE NULL
    END,
    -- Privacy: address only after acceptance
    CASE
      WHEN b.accepted_at IS NOT NULL AND b.assigned_provider_id = auth.uid()
      THEN b.client_address_text
      ELSE NULL
    END,
    -- Privacy: approximate lat before acceptance, precise after
    CASE
      WHEN b.accepted_at IS NOT NULL AND b.assigned_provider_id = auth.uid()
      THEN b.client_lat
      ELSE ROUND(b.client_lat, 1)
    END,
    -- Privacy: approximate lng before acceptance, precise after
    CASE
      WHEN b.accepted_at IS NOT NULL AND b.assigned_provider_id = auth.uid()
      THEN b.client_lng
      ELSE ROUND(b.client_lng, 1)
    END,
    -- Privacy: notes only after acceptance
    CASE
      WHEN b.accepted_at IS NOT NULL AND b.assigned_provider_id = auth.uid()
      THEN b.notes
      ELSE NULL
    END
  FROM public.bookings b
  WHERE
    (b.assigned_provider_id = auth.uid() AND is_provider())
    OR
    (b.status = 'NEW' AND b.assigned_provider_id IS NULL AND is_provider())
  ORDER BY b.scheduled_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
