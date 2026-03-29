-- Add certificate columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS academic_cert_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_cert_url text;

-- Create storage bucket for provider certificates
INSERT INTO storage.buckets (id, name, public)
VALUES ('provider-certificates', 'provider-certificates', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for provider-certificates bucket
CREATE POLICY "Providers can upload own certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'provider-certificates'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Providers can read own certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'provider-certificates'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin()
    OR public.is_cs()
  )
);

CREATE POLICY "Providers can update own certificates"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'provider-certificates'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'provider-certificates'
  AND (storage.foldername(name))[1] = auth.uid()::text
);