
-- Add coordinator_phone to platform_settings
ALTER TABLE public.platform_settings 
ADD COLUMN coordinator_phone text DEFAULT NULL;

-- Set the current admin phone as coordinator phone
UPDATE public.platform_settings 
SET coordinator_phone = '0790619770' 
WHERE id = 1;

-- Update get_provider_bookings to NEVER return customer_phone
-- Provider should only see coordinator phone (fetched separately)
CREATE OR REPLACE FUNCTION public.get_provider_bookings()
RETURNS TABLE(
  id uuid,
  booking_number text,
  service_id text,
  city text,
  scheduled_at timestamptz,
  status text,
  provider_payout numeric,
  subtotal numeric,
  agreed_price numeric,
  assigned_provider_id uuid,
  assigned_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz,
  customer_display_name text,
  customer_phone text,
  client_address_text text,
  client_lat numeric,
  client_lng numeric,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    -- Never return customer phone to provider - they contact admin/coordinator instead
    NULL::text,
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
