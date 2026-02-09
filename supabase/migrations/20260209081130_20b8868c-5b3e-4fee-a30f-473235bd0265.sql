
-- ═══════════════════════════════════════════════════
-- 1) Add specialties + last_active_at to profiles
-- ═══════════════════════════════════════════════════
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- ═══════════════════════════════════════════════════
-- 2) Add agreed_price + internal_note to bookings
-- ═══════════════════════════════════════════════════
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS agreed_price numeric DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS internal_note text DEFAULT NULL;

-- ═══════════════════════════════════════════════════
-- 3) Remove provider self-assign & browse policies
-- ═══════════════════════════════════════════════════
DROP POLICY IF EXISTS "Providers can read new unassigned bookings" ON public.bookings;
DROP POLICY IF EXISTS "Providers can self-assign new bookings" ON public.bookings;

-- ═══════════════════════════════════════════════════
-- 4) Drop and recreate get_provider_bookings()
--    with agreed_price in return type
-- ═══════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.get_provider_bookings();

CREATE OR REPLACE FUNCTION public.get_provider_bookings()
RETURNS TABLE(
  id uuid, booking_number text, service_id text, city text,
  scheduled_at timestamptz, status text, provider_payout numeric,
  subtotal numeric, agreed_price numeric, assigned_provider_id uuid,
  assigned_at timestamptz, accepted_at timestamptz, created_at timestamptz,
  customer_display_name text, customer_phone text,
  client_address_text text, client_lat numeric, client_lng numeric,
  notes text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id, b.booking_number, b.service_id, b.city,
    b.scheduled_at, b.status, b.provider_payout,
    b.subtotal, b.agreed_price, b.assigned_provider_id,
    b.assigned_at, b.accepted_at, b.created_at,
    CASE
      WHEN b.accepted_at IS NOT NULL AND b.assigned_provider_id = auth.uid()
      THEN b.customer_name
      ELSE split_part(b.customer_name, ' ', 1)
    END,
    CASE
      WHEN b.accepted_at IS NOT NULL AND b.assigned_provider_id = auth.uid()
      THEN b.customer_phone
      ELSE NULL
    END,
    CASE
      WHEN b.accepted_at IS NOT NULL AND b.assigned_provider_id = auth.uid()
      THEN b.client_address_text
      ELSE NULL
    END,
    CASE
      WHEN b.accepted_at IS NOT NULL AND b.assigned_provider_id = auth.uid()
      THEN b.client_lat
      ELSE ROUND(b.client_lat, 1)
    END,
    CASE
      WHEN b.accepted_at IS NOT NULL AND b.assigned_provider_id = auth.uid()
      THEN b.client_lng
      ELSE ROUND(b.client_lng, 1)
    END,
    CASE
      WHEN b.accepted_at IS NOT NULL AND b.assigned_provider_id = auth.uid()
      THEN b.notes
      ELSE NULL
    END
  FROM public.bookings b
  WHERE b.assigned_provider_id = auth.uid() AND is_provider()
  ORDER BY b.scheduled_at DESC;
END;
$$;
