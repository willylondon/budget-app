-- Fix: Allow authenticated users to INSERT their own profile on sign-up
CREATE POLICY "Users can create own profile on signup" ON public.profiles
  FOR INSERT WITH CHECK ( auth.uid() = id );

-- Fix: Add a unique constraint on (shipment_id, status_type) for upserts in cron.js
ALTER TABLE public.shipment_statuses
  ADD CONSTRAINT shipment_statuses_unique_type UNIQUE (shipment_id, status_type);

-- Fix: Admins need separate per-operation policies (FOR ALL doesn't work well with INSERT)
-- Drop and recreate admin policies for shipments
DROP POLICY IF EXISTS "Admins can view and edit all shipments" ON public.shipments;

CREATE POLICY "Admins can select all shipments" ON public.shipments
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
  );

CREATE POLICY "Admins can insert shipments" ON public.shipments
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
  );

CREATE POLICY "Admins can update shipments" ON public.shipments
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
  );

CREATE POLICY "Admins can delete shipments" ON public.shipments
  FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
  );
