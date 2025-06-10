
-- Enable RLS on service_categories if not already enabled
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service_categories table
-- Allow admins to do everything with service categories
CREATE POLICY "Admins can manage service categories" 
ON public.service_categories 
FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Allow everyone to read service categories
CREATE POLICY "Everyone can read service categories" 
ON public.service_categories 
FOR SELECT 
TO authenticated 
USING (true);

-- Create cities table for admin management
CREATE TABLE public.cities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  country TEXT DEFAULT 'Georgia',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on cities table
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cities
CREATE POLICY "Admins can manage cities" 
ON public.cities 
FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Everyone can read cities" 
ON public.cities 
FOR SELECT 
TO authenticated 
USING (true);

-- Create districts table for admin management
CREATE TABLE public.districts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city_id INTEGER REFERENCES public.cities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(name, city_id)
);

-- Enable RLS on districts table
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for districts
CREATE POLICY "Admins can manage districts" 
ON public.districts 
FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Everyone can read districts" 
ON public.districts 
FOR SELECT 
TO authenticated 
USING (true);

-- Create car_brands table for admin management
CREATE TABLE public.car_brands (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on car_brands table
ALTER TABLE public.car_brands ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for car_brands
CREATE POLICY "Admins can manage car brands" 
ON public.car_brands 
FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Everyone can read car brands" 
ON public.car_brands 
FOR SELECT 
TO authenticated 
USING (true);

-- Insert some initial data
INSERT INTO public.cities (name) VALUES 
('თბილისი'),
('ბათუმი'),
('ქუთაისი'),
('რუსთავი'),
('გორი'),
('ზუგდიდი'),
('ფოთი'),
('ოზურგეთი'),
('ხაშური'),
('სენაკი'),
('ახალკალაკი'),
('მარნეული'),
('ტელავი'),
('ახმეტა'),
('ბორჯომი'),
('ზესტაფონი'),
('ხობი'),
('სამტრედია'),
('ყვარელი'),
('ლანჩხუთი')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.car_brands (name, is_popular) VALUES 
('BMW', true),
('Mercedes-Benz', true),
('Audi', true),
('Toyota', true),
('Honda', true),
('Nissan', true),
('Hyundai', true),
('Kia', true),
('Volkswagen', true),
('Ford', true),
('Chevrolet', true),
('Mazda', true),
('Subaru', true),
('Lexus', true),
('Infiniti', false),
('Acura', false),
('Jeep', false),
('Land Rover', false),
('Porsche', false),
('Volvo', false),
('Peugeot', false),
('Renault', false),
('Fiat', false),
('Opel', false),
('Skoda', false)
ON CONFLICT (name) DO NOTHING;

-- Add some districts for Tbilisi
INSERT INTO public.districts (name, city_id) 
SELECT unnest(ARRAY[
  'ვაკე',
  'საბურთალო',
  'დიდუბე',
  'ისანი',
  'გლდანი',
  'ნაძალადევი',
  'სამგორი',
  'ჩუღურეთი',
  'მცხეთა',
  'ქრწანისი'
]), id 
FROM public.cities 
WHERE name = 'თბილისი'
ON CONFLICT (name, city_id) DO NOTHING;

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON public.cities FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_districts_updated_at BEFORE UPDATE ON public.districts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_car_brands_updated_at BEFORE UPDATE ON public.car_brands FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
