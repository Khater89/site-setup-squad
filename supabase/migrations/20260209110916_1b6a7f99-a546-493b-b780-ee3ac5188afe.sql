
-- ============================================================
-- FIX 1: Block providers from directly querying the bookings table
-- Forces them to use get_provider_bookings() / provider_orders_safe()
-- which already mask sensitive fields (customer phone, address, etc.)
-- ============================================================
DROP POLICY IF EXISTS "block_provider_select_bookings" ON public.bookings;

CREATE POLICY "block_provider_select_bookings"
ON public.bookings
AS RESTRICTIVE
FOR SELECT
USING (NOT is_provider() OR is_admin() OR is_cs());
-- Pure providers are blocked from direct SELECT
-- Dual-role users (provider+admin) are allowed through

-- ============================================================
-- FIX 2: Add role check to find_nearest_providers()
-- Prevents any authenticated user from harvesting provider PII
-- ============================================================
CREATE OR REPLACE FUNCTION public.find_nearest_providers(_lat numeric, _lng numeric, _limit integer DEFAULT 10)
RETURNS TABLE(provider_id uuid, full_name text, city text, distance_km numeric, available_now boolean, phone text, role_type text, experience_years integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admin and CS can search for providers
  IF NOT (public.is_admin() OR public.is_cs()) THEN
    RAISE EXCEPTION 'Access denied: only admin and CS can search providers';
  END IF;

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
$$;

-- ============================================================
-- FIX 3: Enable RLS on booking_contacts and add proper policies
-- This table stores sensitive customer PII (phone, address, name)
-- ============================================================
ALTER TABLE public.booking_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read booking contacts"
ON public.booking_contacts
FOR SELECT
USING (is_admin());

CREATE POLICY "CS can read booking contacts"
ON public.booking_contacts
FOR SELECT
USING (is_cs());

CREATE POLICY "System can insert booking contacts"
ON public.booking_contacts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update booking contacts"
ON public.booking_contacts
FOR UPDATE
USING (is_admin());

CREATE POLICY "CS can update booking contacts"
ON public.booking_contacts
FOR UPDATE
USING (is_cs());
