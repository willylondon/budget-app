-- ============================================
-- FIX: Infinite recursion in profiles RLS
-- 
-- The problem: policies on `profiles` that do
--   (SELECT role FROM profiles WHERE id = auth.uid())
-- cause infinite recursion because that SELECT
-- re-triggers the same RLS policy.
--
-- The fix: a SECURITY DEFINER function that 
-- bypasses RLS when looking up the current user's role.
-- ============================================

-- 1. Create a helper function that runs with elevated privileges
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS role_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Drop ALL existing policies that cause the recursion
DROP POLICY IF EXISTS "Admins can view and edit all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can only view/edit own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile on signup" ON public.profiles;

DROP POLICY IF EXISTS "Admins can view and edit all shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admins can select all shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admins can insert shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admins can update shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admins can delete shipments" ON public.shipments;
DROP POLICY IF EXISTS "Importers can view own shipments" ON public.shipments;

DROP POLICY IF EXISTS "Admins view all statuses" ON public.shipment_statuses;
DROP POLICY IF EXISTS "Importers view own statuses" ON public.shipment_statuses;

-- ============================================
-- 3. PROFILES policies (no self-referencing subqueries!)
-- ============================================

-- Users can always read their own profile row (needed for the app to work)
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING ( auth.uid() = id );

-- Users can insert their own profile on sign-up
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK ( auth.uid() = id );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING ( auth.uid() = id );

-- Admins can also read ALL profiles (uses the safe function)
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING ( public.get_my_role() = 'Admin' );

-- ============================================
-- 4. SHIPMENTS policies (uses safe function)
-- ============================================

CREATE POLICY "Admins can select all shipments" ON public.shipments
  FOR SELECT USING ( public.get_my_role() = 'Admin' );

CREATE POLICY "Admins can insert shipments" ON public.shipments
  FOR INSERT WITH CHECK ( public.get_my_role() = 'Admin' );

CREATE POLICY "Admins can update shipments" ON public.shipments
  FOR UPDATE USING ( public.get_my_role() = 'Admin' );

CREATE POLICY "Admins can delete shipments" ON public.shipments
  FOR DELETE USING ( public.get_my_role() = 'Admin' );

CREATE POLICY "Importers can view own shipments" ON public.shipments
  FOR SELECT USING ( importer_id = auth.uid() );

-- ============================================
-- 5. SHIPMENT_STATUSES policies (uses safe function)
-- ============================================

CREATE POLICY "Admins view all statuses" ON public.shipment_statuses
  FOR SELECT USING ( public.get_my_role() = 'Admin' );

CREATE POLICY "Admins insert statuses" ON public.shipment_statuses
  FOR INSERT WITH CHECK ( public.get_my_role() = 'Admin' );

CREATE POLICY "Admins update statuses" ON public.shipment_statuses
  FOR UPDATE USING ( public.get_my_role() = 'Admin' );

CREATE POLICY "Importers view own statuses" ON public.shipment_statuses
  FOR SELECT USING (
    shipment_id IN (SELECT id FROM public.shipments WHERE importer_id = auth.uid())
  );
