
-- Create suspension_requests table
CREATE TABLE public.suspension_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  requested_by_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suspension_requests ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "admin_manage_suspension_requests"
ON public.suspension_requests
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- CS can read all and insert new requests
CREATE POLICY "cs_read_suspension_requests"
ON public.suspension_requests
FOR SELECT
USING (public.is_cs());

CREATE POLICY "cs_insert_suspension_requests"
ON public.suspension_requests
FOR INSERT
WITH CHECK (public.is_cs() AND requested_by_id = auth.uid());
