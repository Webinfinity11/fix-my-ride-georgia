-- Create laundries table
CREATE TABLE public.laundries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  contact_number TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC NOT NULL,
  water_price NUMERIC,
  foam_price NUMERIC,
  wax_price NUMERIC,
  box_count INTEGER,
  photos TEXT[] DEFAULT ARRAY[]::text[],
  videos TEXT[] DEFAULT ARRAY[]::text[],
  slug TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users
);

-- Enable RLS
ALTER TABLE public.laundries ENABLE ROW LEVEL SECURITY;

-- RLS Policies - only admins can manage laundries
CREATE POLICY "Anyone can view laundries"
ON public.laundries
FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert laundries"
ON public.laundries
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can update laundries"
ON public.laundries
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete laundries"
ON public.laundries
FOR DELETE
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_laundries_updated_at
  BEFORE UPDATE ON public.laundries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function for laundry slug generation
CREATE OR REPLACE FUNCTION public.generate_unique_laundry_slug(base_name text, exclude_id integer DEFAULT NULL::integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 1;
    max_attempts integer := 1000;
BEGIN
    base_slug := georgian_to_latin_enhanced(base_name);
    
    IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := 'laundry';
    END IF;
    
    final_slug := base_slug;
    
    WHILE counter <= max_attempts LOOP
        IF NOT EXISTS (
            SELECT 1 FROM laundries 
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
$function$;

-- Create trigger for laundry slug generation
CREATE OR REPLACE FUNCTION public.laundry_slug_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.slug IS NULL OR NEW.slug = '' THEN
            NEW.slug := generate_unique_laundry_slug(NEW.name);
        END IF;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        IF OLD.name != NEW.name AND (NEW.slug IS NULL OR NEW.slug = '') THEN
            NEW.slug := generate_unique_laundry_slug(NEW.name, NEW.id);
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$function$;

CREATE TRIGGER laundry_slug_trigger
  BEFORE INSERT OR UPDATE ON public.laundries
  FOR EACH ROW
  EXECUTE FUNCTION laundry_slug_trigger();