-- Create drives table
CREATE TABLE IF NOT EXISTS public.drives (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  description TEXT,
  contact_number TEXT,
  latitude NUMERIC,
  longitude NUMERIC NOT NULL,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  videos TEXT[] DEFAULT ARRAY[]::TEXT[],
  slug TEXT UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.drives ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view drives"
  ON public.drives
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert drives"
  ON public.drives
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can update drives"
  ON public.drives
  FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete drives"
  ON public.drives
  FOR DELETE
  USING (is_admin(auth.uid()));

-- Create slug generation function for drives
CREATE OR REPLACE FUNCTION public.generate_unique_drive_slug(base_name TEXT, exclude_id INTEGER DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
    max_attempts INTEGER := 1000;
BEGIN
    base_slug := georgian_to_latin_enhanced(base_name);
    
    IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := 'drive';
    END IF;
    
    final_slug := base_slug;
    
    WHILE counter <= max_attempts LOOP
        IF NOT EXISTS (
            SELECT 1 FROM drives 
            WHERE slug = final_slug 
            AND (exclude_id IS NULL OR id != exclude_id)
        ) THEN
            RETURN final_slug;
        END IF;
        
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    final_slug := base_slug || '-' || extract(epoch from now())::bigint;
    RETURN final_slug;
END;
$$;

-- Create trigger for automatic slug generation
CREATE OR REPLACE FUNCTION public.drive_slug_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.slug IS NULL OR NEW.slug = '' THEN
            NEW.slug := generate_unique_drive_slug(NEW.name);
        END IF;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        IF OLD.name != NEW.name AND (NEW.slug IS NULL OR NEW.slug = '') THEN
            NEW.slug := generate_unique_drive_slug(NEW.name, NEW.id);
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$;

CREATE TRIGGER drives_slug_trigger
  BEFORE INSERT OR UPDATE ON public.drives
  FOR EACH ROW
  EXECUTE FUNCTION public.drive_slug_trigger();

-- Create indexes for performance
CREATE INDEX idx_drives_slug ON public.drives(slug);
CREATE INDEX idx_drives_location ON public.drives(latitude, longitude);

-- Create updated_at trigger
CREATE TRIGGER update_drives_updated_at
  BEFORE UPDATE ON public.drives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();