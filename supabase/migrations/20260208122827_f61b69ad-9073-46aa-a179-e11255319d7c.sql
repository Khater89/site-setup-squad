
-- 1. Create is_cs() security definer function
CREATE OR REPLACE FUNCTION public.is_cs()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'cs')
$$;

-- 2. RLS: CS can read all bookings
CREATE POLICY "CS can read all bookings"
ON public.bookings FOR SELECT
USING (public.is_cs());

-- 3. RLS: CS can create bookings for clients (phone bookings)
CREATE POLICY "CS can create bookings for clients"
ON public.bookings FOR INSERT
WITH CHECK (public.is_cs());

-- 4. RLS: CS can update bookings (for assignment)
CREATE POLICY "CS can update bookings"
ON public.bookings FOR UPDATE
USING (public.is_cs());

-- 5. RLS: CS can read all profiles (to see provider info)
CREATE POLICY "CS can read all profiles"
ON public.profiles FOR SELECT
USING (public.is_cs());

-- 6. RLS: CS can read all services (including inactive)
CREATE POLICY "CS can read all services"
ON public.services FOR SELECT
USING (public.is_cs());
