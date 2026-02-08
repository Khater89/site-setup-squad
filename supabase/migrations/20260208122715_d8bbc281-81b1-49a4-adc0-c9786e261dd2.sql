
-- 1. Add 'cs' (Customer Service) to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cs';

-- 2. Extend profiles with provider-specific fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS role_type text,
ADD COLUMN IF NOT EXISTS experience_years integer,
ADD COLUMN IF NOT EXISTS tools text[],
ADD COLUMN IF NOT EXISTS languages text[],
ADD COLUMN IF NOT EXISTS available_now boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS schedule_json jsonb,
ADD COLUMN IF NOT EXISTS radius_km integer DEFAULT 20,
ADD COLUMN IF NOT EXISTS address_text text,
ADD COLUMN IF NOT EXISTS license_id text,
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- 3. Extend bookings with assignment metadata
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
ADD COLUMN IF NOT EXISTS assigned_by text;
