-- Create parts_orders table
CREATE TABLE public.parts_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  car_brand TEXT NOT NULL,
  car_model TEXT NOT NULL,
  car_year TEXT,
  engine_volume TEXT,
  part_name TEXT NOT NULL,
  part_description TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'completed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parts_orders ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (submit form)
CREATE POLICY "Anyone can insert parts orders"
ON public.parts_orders
FOR INSERT
WITH CHECK (true);

-- Only admins can view
CREATE POLICY "Admins can view all parts orders"
ON public.parts_orders
FOR SELECT
USING (is_admin(auth.uid()));

-- Only admins can update
CREATE POLICY "Admins can update parts orders"
ON public.parts_orders
FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Only admins can delete
CREATE POLICY "Admins can delete parts orders"
ON public.parts_orders
FOR DELETE
USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_parts_orders_updated_at
BEFORE UPDATE ON public.parts_orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();