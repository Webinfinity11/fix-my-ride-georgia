-- Create fuel page settings table for banner
CREATE TABLE IF NOT EXISTS public.fuel_page_settings (
  id TEXT PRIMARY KEY DEFAULT '1',
  banner_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.fuel_page_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view the banner
CREATE POLICY "Anyone can view fuel page settings"
  ON public.fuel_page_settings
  FOR SELECT
  USING (true);

-- Only admins can update the banner
CREATE POLICY "Only admins can update fuel page settings"
  ON public.fuel_page_settings
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Insert default row
INSERT INTO public.fuel_page_settings (id) VALUES ('1')
ON CONFLICT (id) DO NOTHING;