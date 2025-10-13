-- Create saved_services table
CREATE TABLE public.saved_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id integer NOT NULL REFERENCES mechanic_services(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  UNIQUE(user_id, service_id)
);

-- Enable Row Level Security
ALTER TABLE public.saved_services ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_services
CREATE POLICY "Users can view their own saved services"
ON public.saved_services
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save services"
ON public.saved_services
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved services"
ON public.saved_services
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_saved_services_user_id ON public.saved_services(user_id);
CREATE INDEX idx_saved_services_service_id ON public.saved_services(service_id);

-- Admin policy to view all saved services
CREATE POLICY "Admins can view all saved services"
ON public.saved_services
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);