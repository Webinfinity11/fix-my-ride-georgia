-- Fix security warnings: Set search_path for functions

-- Update georgian_to_latin function with secure search_path
CREATE OR REPLACE FUNCTION georgian_to_latin(input_text text)
RETURNS text 
LANGUAGE plpgsql 
IMMUTABLE 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    result text;
BEGIN
    result := lower(trim(input_text));
    
    -- Georgian to Latin character mapping
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
    result := replace(result, 'ფ', 'p');
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
    
    -- Limit length to 50 characters
    IF length(result) > 50 THEN
        result := substring(result from 1 for 50);
        -- Remove trailing hyphen if cut off in middle of word
        result := trim(result, '-');
    END IF;
    
    RETURN result;
END;
$$;

-- Update generate_unique_slug function with secure search_path
CREATE OR REPLACE FUNCTION generate_unique_slug(base_name text, exclude_id integer DEFAULT NULL)
RETURNS text 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 1;
BEGIN
    -- Generate base slug from name
    base_slug := georgian_to_latin(base_name);
    
    -- If base slug is empty, use fallback
    IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := 'service';
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness and add counter if needed
    WHILE EXISTS (
        SELECT 1 FROM mechanic_services 
        WHERE slug = final_slug 
        AND (exclude_id IS NULL OR id != exclude_id)
    ) LOOP
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_slug;
END;
$$;

-- Update smart_slug_trigger function with secure search_path
CREATE OR REPLACE FUNCTION smart_slug_trigger()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Only auto-generate slug if:
    -- 1. It's a new record (INSERT) and no slug provided, OR
    -- 2. It's an update (UPDATE) and slug_is_manual is false and name changed
    
    IF TG_OP = 'INSERT' THEN
        -- New record
        IF NEW.slug IS NULL OR NEW.slug = '' THEN
            NEW.slug := generate_unique_slug(NEW.name);
            NEW.slug_is_manual := false;
        ELSE
            -- Slug was manually provided
            NEW.slug_is_manual := true;
        END IF;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Existing record update
        
        -- If slug was manually changed (different from what auto-generator would create)
        IF OLD.slug != NEW.slug AND NEW.slug IS NOT NULL AND NEW.slug != '' THEN
            NEW.slug_is_manual := true;
        END IF;
        
        -- If name changed and slug is not manual, regenerate slug
        IF OLD.name != NEW.name AND (OLD.slug_is_manual = false OR OLD.slug_is_manual IS NULL) THEN
            NEW.slug := generate_unique_slug(NEW.name, NEW.id);
            NEW.slug_is_manual := false;
        END IF;
        
        -- If slug is empty, always regenerate
        IF NEW.slug IS NULL OR NEW.slug = '' THEN
            NEW.slug := generate_unique_slug(NEW.name, NEW.id);
            NEW.slug_is_manual := false;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;