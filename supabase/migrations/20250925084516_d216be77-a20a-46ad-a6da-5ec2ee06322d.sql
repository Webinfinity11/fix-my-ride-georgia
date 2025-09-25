-- Fix slug duplication issue by improving the slug generation logic

-- First, let's fix the smart_slug_trigger_enhanced function to prevent duplication
CREATE OR REPLACE FUNCTION public.smart_slug_trigger_enhanced()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Handle INSERT operations
    IF TG_OP = 'INSERT' THEN
        -- If no slug provided, generate one automatically
        IF NEW.slug IS NULL OR NEW.slug = '' THEN
            NEW.slug := generate_unique_slug_enhanced(NEW.name);
            NEW.slug_is_manual := false;
        ELSE
            -- Slug was manually provided, mark as manual but ensure it's clean
            NEW.slug := georgian_to_latin_enhanced(NEW.slug);
            NEW.slug_is_manual := true;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        -- If slug was manually changed and is different from auto-generated, mark as manual
        IF OLD.slug != NEW.slug AND NEW.slug IS NOT NULL AND NEW.slug != '' THEN
            -- Clean the manually provided slug
            NEW.slug := georgian_to_latin_enhanced(NEW.slug);
            NEW.slug_is_manual := true;
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
$function$;

-- Clean up existing duplicated slugs
UPDATE mechanic_services 
SET slug = georgian_to_latin_enhanced(name),
    slug_is_manual = false
WHERE LENGTH(slug) > 50 OR slug ~ '^(.+)\1+' OR slug LIKE '%-%-%-%';

-- Also clean up any remaining malformed slugs
UPDATE mechanic_services 
SET slug = generate_unique_slug_enhanced(name, id),
    slug_is_manual = false
WHERE slug IS NULL OR slug = '' OR LENGTH(slug) > 100;