-- Enhanced slug generation system for mechanic_services table

-- First, ensure the slug_is_manual column exists
ALTER TABLE public.mechanic_services 
ADD COLUMN IF NOT EXISTS slug_is_manual boolean DEFAULT false;

-- Create an improved Georgian to Latin transliteration function
CREATE OR REPLACE FUNCTION public.georgian_to_latin_enhanced(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result text;
BEGIN
    IF input_text IS NULL OR trim(input_text) = '' THEN
        RETURN '';
    END IF;
    
    result := lower(trim(input_text));
    
    -- Georgian to Latin character mapping (comprehensive)
    result := replace(result, 'ა', 'a');
    result := replace(result, 'ბ', 'b');
    result := replace(result, 'გ', 'g');
    result := replace(result, 'დ', 'd');
    result := replace(result, 'ე', 'e');
    result := replace(result, 'ვ', 'v');
    result := replace(result, 'ზ', 'z');
    result := replace(result, 'თ', 't');
    result := replace(result, 'ი', 'i');
    result := replace(result, 'კ', 'k');
    result := replace(result, 'ლ', 'l');
    result := replace(result, 'მ', 'm');
    result := replace(result, 'ნ', 'n');
    result := replace(result, 'ო', 'o');
    result := replace(result, 'პ', 'p');
    result := replace(result, 'ჟ', 'zh');
    result := replace(result, 'რ', 'r');
    result := replace(result, 'ს', 's');
    result := replace(result, 'ტ', 't');
    result := replace(result, 'უ', 'u');
    result := replace(result, 'ფ', 'f');
    result := replace(result, 'ქ', 'q');
    result := replace(result, 'ღ', 'gh');
    result := replace(result, 'ყ', 'q');
    result := replace(result, 'შ', 'sh');
    result := replace(result, 'ჩ', 'ch');
    result := replace(result, 'ც', 'ts');
    result := replace(result, 'ძ', 'dz');
    result := replace(result, 'წ', 'ts');
    result := replace(result, 'ჭ', 'ch');
    result := replace(result, 'ხ', 'kh');
    result := replace(result, 'ჯ', 'j');
    result := replace(result, 'ჰ', 'h');
    
    -- Remove special characters except spaces and hyphens
    result := regexp_replace(result, '[^\w\s-]', '', 'g');
    
    -- Replace spaces and underscores with hyphens
    result := regexp_replace(result, '[\s_]+', '-', 'g');
    
    -- Remove multiple consecutive hyphens
    result := regexp_replace(result, '-+', '-', 'g');
    
    -- Remove leading/trailing hyphens
    result := trim(result, '-');
    
    -- Limit length to 50 characters and ensure it ends properly
    IF length(result) > 50 THEN
        result := substring(result from 1 for 50);
        result := trim(result, '-');
    END IF;
    
    -- Fallback if result is empty
    IF result = '' OR result IS NULL THEN
        result := 'service';
    END IF;
    
    RETURN result;
END;
$$;

-- Create enhanced unique slug generation function
CREATE OR REPLACE FUNCTION public.generate_unique_slug_enhanced(base_name text, exclude_id integer DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 1;
    max_attempts integer := 1000;
BEGIN
    -- Generate base slug from name
    base_slug := georgian_to_latin_enhanced(base_name);
    
    -- If base slug is empty, use fallback
    IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := 'service';
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness and add counter if needed
    WHILE counter <= max_attempts LOOP
        -- Check if slug exists (excluding current record if updating)
        IF NOT EXISTS (
            SELECT 1 FROM mechanic_services 
            WHERE slug = final_slug 
            AND (exclude_id IS NULL OR id != exclude_id)
            AND is_active = true
        ) THEN
            RETURN final_slug;
        END IF;
        
        -- Increment counter and try again
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    -- Fallback with timestamp if max attempts reached
    final_slug := base_slug || '-' || extract(epoch from now())::bigint;
    
    RETURN final_slug;
END;
$$;

-- Create smart slug trigger function
CREATE OR REPLACE FUNCTION public.smart_slug_trigger_enhanced()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Handle INSERT operations
    IF TG_OP = 'INSERT' THEN
        -- If no slug provided, generate one automatically
        IF NEW.slug IS NULL OR NEW.slug = '' THEN
            NEW.slug := generate_unique_slug_enhanced(NEW.name);
            NEW.slug_is_manual := false;
        ELSE
            -- Slug was manually provided, mark as manual
            NEW.slug_is_manual := true;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        -- If slug was manually changed (different from auto-generated), mark as manual
        IF OLD.slug != NEW.slug AND NEW.slug IS NOT NULL AND NEW.slug != '' THEN
            -- Check if the new slug is different from what would be auto-generated
            IF NEW.slug != generate_unique_slug_enhanced(NEW.name, NEW.id) THEN
                NEW.slug_is_manual := true;
            END IF;
        END IF;
        
        -- If name changed and slug is not manual, regenerate slug
        IF OLD.name != NEW.name AND COALESCE(OLD.slug_is_manual, false) = false THEN
            NEW.slug := generate_unique_slug_enhanced(NEW.name, NEW.id);
            NEW.slug_is_manual := false;
        END IF;
        
        -- If slug is empty or null, always regenerate
        IF NEW.slug IS NULL OR NEW.slug = '' THEN
            NEW.slug := generate_unique_slug_enhanced(NEW.name, NEW.id);
            NEW.slug_is_manual := false;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS smart_slug_trigger ON public.mechanic_services;

-- Create the trigger
CREATE TRIGGER smart_slug_trigger_enhanced
    BEFORE INSERT OR UPDATE ON public.mechanic_services
    FOR EACH ROW
    EXECUTE FUNCTION smart_slug_trigger_enhanced();

-- Update existing records without slugs
UPDATE public.mechanic_services 
SET slug = generate_unique_slug_enhanced(name, id),
    slug_is_manual = false
WHERE slug IS NULL OR slug = '';

-- Create index for better slug lookup performance
CREATE INDEX IF NOT EXISTS idx_mechanic_services_slug ON public.mechanic_services(slug) WHERE is_active = true;