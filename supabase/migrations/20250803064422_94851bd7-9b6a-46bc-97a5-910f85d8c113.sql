-- Create booking_settings table for managing booking functionality
CREATE TABLE public.booking_settings (
  id TEXT NOT NULL PRIMARY KEY DEFAULT '1', -- Singleton table with fixed ID
  booking_enabled BOOLEAN NOT NULL DEFAULT true,
  maintenance_message TEXT DEFAULT '',
  max_advance_days INTEGER NOT NULL DEFAULT 30,
  min_advance_hours INTEGER NOT NULL DEFAULT 2,
  booking_fee_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  auto_confirm_bookings BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Only admins can manage booking settings" 
ON public.booking_settings 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_booking_settings_updated_at
BEFORE UPDATE ON public.booking_settings
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Insert default settings
INSERT INTO public.booking_settings (id) VALUES ('1');