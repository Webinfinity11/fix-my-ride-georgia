-- Create evacuation_requests table
CREATE TABLE public.evacuation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.evacuation_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert evacuation requests (for unauthenticated users)
CREATE POLICY "Anyone can insert evacuation requests"
  ON public.evacuation_requests FOR INSERT
  WITH CHECK (true);

-- Only admins can view evacuation requests
CREATE POLICY "Admins can view evacuation requests"
  ON public.evacuation_requests FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admins can update evacuation requests
CREATE POLICY "Admins can update evacuation requests"
  ON public.evacuation_requests FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admins can delete evacuation requests
CREATE POLICY "Admins can delete evacuation requests"
  ON public.evacuation_requests FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_evacuation_requests_updated_at
  BEFORE UPDATE ON public.evacuation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();