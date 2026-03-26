-- Allow customers to insert ratings for their own bookings
CREATE POLICY "customer_insert_rating"
ON public.provider_ratings
FOR INSERT
TO authenticated
WITH CHECK (
  is_customer() AND
  rated_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = booking_id
    AND bookings.customer_user_id = auth.uid()
    AND bookings.status = 'COMPLETED'
  )
);

-- Allow customers to read their own ratings
CREATE POLICY "customer_read_own_ratings"
ON public.provider_ratings
FOR SELECT
TO authenticated
USING (rated_by = auth.uid());