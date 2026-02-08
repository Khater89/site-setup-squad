
-- ============================================
-- MFN BOOKING PLATFORM - FULL DATABASE SCHEMA
-- ============================================

-- 1) Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'provider', 'customer');

-- 2) User Roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3) Profiles table
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  provider_status TEXT NOT NULL DEFAULT 'pending' CHECK (provider_status IN ('pending', 'approved', 'suspended')),
  stripe_connect_account_id TEXT,
  stripe_connect_onboarding_status TEXT DEFAULT 'not_started' CHECK (stripe_connect_onboarding_status IN ('not_started', 'in_progress', 'complete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4) Services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  base_price NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, city)
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 5) Platform Settings (single row)
CREATE TABLE public.platform_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  platform_fee_percent NUMERIC NOT NULL DEFAULT 10,
  deposit_percent NUMERIC NOT NULL DEFAULT 20,
  provider_debt_limit NUMERIC NOT NULL DEFAULT -20,
  setup_completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Insert default settings row
INSERT INTO public.platform_settings (id) VALUES (1);

-- 6) Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id UUID REFERENCES auth.users(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  city TEXT NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONFIRMED', 'ASSIGNED', 'COMPLETED', 'CANCELLED')),
  assigned_provider_id UUID REFERENCES auth.users(id),
  -- Payment
  payment_method TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'CARD', 'CASH_DEPOSIT')),
  payment_status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID', 'PARTIALLY_PAID', 'REFUNDED')),
  -- Amounts
  subtotal NUMERIC NOT NULL DEFAULT 0,
  platform_fee NUMERIC NOT NULL DEFAULT 0,
  provider_payout NUMERIC NOT NULL DEFAULT 0,
  -- Deposit fields
  deposit_amount NUMERIC DEFAULT 0,
  remaining_cash_amount NUMERIC DEFAULT 0,
  deposit_status TEXT DEFAULT 'NONE' CHECK (deposit_status IN ('NONE', 'REQUIRED', 'PAID', 'REFUNDED')),
  -- Stripe
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  connect_charge_type TEXT DEFAULT 'none' CHECK (connect_charge_type IN ('none', 'destination_charge', 'separate_transfer')),
  stripe_transfer_id TEXT,
  stripe_application_fee_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 7) Provider Wallet Ledger
CREATE TABLE public.provider_wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES auth.users(id),
  booking_id UUID REFERENCES public.bookings(id),
  amount NUMERIC NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('commission', 'settlement', 'adjustment')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_wallet_ledger ENABLE ROW LEVEL SECURITY;

-- 8) Notifications Log
CREATE TABLE public.notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id),
  type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS (Security Definer)
-- ============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Shortcut: is current user admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Shortcut: is current user provider?
CREATE OR REPLACE FUNCTION public.is_provider()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'provider')
$$;

-- Shortcut: is current user customer?
CREATE OR REPLACE FUNCTION public.is_customer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'customer')
$$;

-- Get provider wallet balance
CREATE OR REPLACE FUNCTION public.get_provider_balance(_provider_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM public.provider_wallet_ledger
  WHERE provider_id = _provider_id
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile + customer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================

-- user_roles policies
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- profiles policies
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "System can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- services policies
CREATE POLICY "Anyone can read active services"
  ON public.services FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can read all services"
  ON public.services FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert services"
  ON public.services FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update services"
  ON public.services FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete services"
  ON public.services FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- platform_settings policies
CREATE POLICY "Anyone can read settings"
  ON public.platform_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update settings"
  ON public.platform_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- bookings policies
CREATE POLICY "Anyone can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read all bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Customers can read own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (customer_user_id = auth.uid());

CREATE POLICY "Providers can read assigned bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (assigned_provider_id = auth.uid() AND public.is_provider());

CREATE POLICY "Admins can update all bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Providers can update assigned bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (assigned_provider_id = auth.uid() AND public.is_provider());

-- provider_wallet_ledger policies
CREATE POLICY "Admins can manage wallet"
  ON public.provider_wallet_ledger FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Providers can read own wallet"
  ON public.provider_wallet_ledger FOR SELECT
  TO authenticated
  USING (provider_id = auth.uid() AND public.is_provider());

-- notifications_log policies
CREATE POLICY "Admins can manage notifications"
  ON public.notifications_log FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- System insert for notifications (service role)
CREATE POLICY "System can insert notifications"
  ON public.notifications_log FOR INSERT
  WITH CHECK (true);

-- ============================================
-- ADMIN ROLE MANAGEMENT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id UUID, new_role app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can change roles';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Remove role function
CREATE OR REPLACE FUNCTION public.remove_user_role(target_user_id UUID, old_role app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can remove roles';
  END IF;
  
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = old_role;
END;
$$;
