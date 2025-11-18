-- Create auto_leads table for storing leads from leasing, dealers, and insurance pages
CREATE TABLE IF NOT EXISTS public.auto_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  comment TEXT,
  lead_type TEXT NOT NULL CHECK (lead_type IN ('leasing', 'dealers', 'insurance')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.auto_leads ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to insert leads (public form submission)
CREATE POLICY "Anyone can insert leads"
  ON public.auto_leads
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only admins can view leads
CREATE POLICY "Admins can view all leads"
  ON public.auto_leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can update leads
CREATE POLICY "Admins can update leads"
  ON public.auto_leads
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can delete leads
CREATE POLICY "Admins can delete leads"
  ON public.auto_leads
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX idx_auto_leads_lead_type ON public.auto_leads(lead_type);
CREATE INDEX idx_auto_leads_status ON public.auto_leads(status);
CREATE INDEX idx_auto_leads_created_at ON public.auto_leads(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_auto_leads_updated_at
  BEFORE UPDATE ON public.auto_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
