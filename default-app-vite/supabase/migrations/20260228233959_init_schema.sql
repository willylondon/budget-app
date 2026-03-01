-- 1. Create custom types
CREATE TYPE role_type AS ENUM ('Admin', 'Importer');
CREATE TYPE tracking_role AS ENUM ('Declarant', 'Importer');

-- 2. Create the Profiles table (extends Supabase Auth Users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  company_name TEXT NOT NULL,
  role role_type DEFAULT 'Importer'::role_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Turn on Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create the Shipments table
CREATE TABLE public.shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  importer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  office_code TEXT NOT NULL,
  year TEXT NOT NULL,
  commercial_reference TEXT NOT NULL,
  trn TEXT NOT NULL,
  tracking_role tracking_role DEFAULT 'Declarant'::tracking_role NOT NULL,
  status TEXT DEFAULT 'Pending',
  customs_reference TEXT,
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- 4. Create the Shipment Statuses table (for historical tracking of subunit statuses)
CREATE TABLE public.shipment_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE NOT NULL,
  status_type TEXT NOT NULL,
  status_value TEXT NOT NULL,
  date_time_assigned TIMESTAMPTZ,
  date_time_completed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.shipment_statuses ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Admins can do everything to profiles
CREATE POLICY "Admins can view and edit all profiles" ON public.profiles
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
  );

-- Importers can only view/edit their own profile
CREATE POLICY "Users can only view/edit own profile" ON public.profiles
  FOR ALL USING ( auth.uid() = id );

-- Admins can do everything to shipments
CREATE POLICY "Admins can view and edit all shipments" ON public.shipments
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
  );

-- Importers can only view their own shipments
CREATE POLICY "Importers can view own shipments" ON public.shipments
  FOR SELECT USING ( importer_id = auth.uid() );

-- Same logic for shipment statuses
CREATE POLICY "Admins view all statuses" ON public.shipment_statuses
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
  );

CREATE POLICY "Importers view own statuses" ON public.shipment_statuses
  FOR SELECT USING (
    shipment_id IN (SELECT id FROM public.shipments WHERE importer_id = auth.uid())
  );
