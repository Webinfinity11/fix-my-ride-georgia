-- Create fuel_importers table
CREATE TABLE IF NOT EXISTS public.fuel_importers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  super_ron_98_price NUMERIC(10,2),
  premium_ron_96_price NUMERIC(10,2),
  regular_ron_93_price NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.fuel_importers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view fuel importers
CREATE POLICY "Anyone can view fuel importers"
  ON public.fuel_importers
  FOR SELECT
  USING (true);

-- Only admins can insert fuel importers
CREATE POLICY "Only admins can insert fuel importers"
  ON public.fuel_importers
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Only admins can update fuel importers
CREATE POLICY "Only admins can update fuel importers"
  ON public.fuel_importers
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- Only admins can delete fuel importers
CREATE POLICY "Only admins can delete fuel importers"
  ON public.fuel_importers
  FOR DELETE
  USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_fuel_importers_updated_at
  BEFORE UPDATE ON public.fuel_importers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for fuel importer logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('fuel-importer-logos', 'fuel-importer-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for fuel importer logos
CREATE POLICY "Anyone can view fuel importer logos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'fuel-importer-logos');

CREATE POLICY "Admins can upload fuel importer logos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'fuel-importer-logos' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update fuel importer logos"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'fuel-importer-logos' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete fuel importer logos"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'fuel-importer-logos' AND is_admin(auth.uid()));