
-- Allow authenticated users to read their own staff_users row
CREATE POLICY "Users can read own staff role"
ON public.staff_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow admins to manage all staff_users
CREATE POLICY "Admins can manage staff users"
ON public.staff_users
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
