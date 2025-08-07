-- Step 1: Find and fix all duplicate slugs
-- First, let's create a function to fix duplicates
CREATE OR REPLACE FUNCTION fix_duplicate_slugs()
RETURNS void AS $$
DECLARE
  dup_record RECORD;
  service_record RECORD;
  counter INTEGER;
  new_slug TEXT;
BEGIN
  -- Loop through each duplicate slug group
  FOR dup_record IN (
    SELECT slug, array_agg(id ORDER BY created_at) as service_ids
    FROM mechanic_services 
    WHERE slug IS NOT NULL 
    GROUP BY slug 
    HAVING COUNT(*) > 1
  ) LOOP
    
    -- Keep the first service with original slug, update others
    counter := 1;
    
    -- Loop through all services except the first one
    FOR service_record IN (
      SELECT id, name
      FROM mechanic_services 
      WHERE id = ANY(dup_record.service_ids[2:]) -- Skip first element
      ORDER BY created_at
    ) LOOP
      
      -- Generate new unique slug
      new_slug := dup_record.slug || '-' || counter;
      
      -- Check if this new slug exists and increment until unique
      WHILE EXISTS (SELECT 1 FROM mechanic_services WHERE slug = new_slug) LOOP
        counter := counter + 1;
        new_slug := dup_record.slug || '-' || counter;
      END LOOP;
      
      -- Update the service with the new unique slug
      UPDATE mechanic_services 
      SET slug = new_slug 
      WHERE id = service_record.id;
      
      counter := counter + 1;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Duplicate slugs have been fixed';
END;
$$ LANGUAGE plpgsql;

-- Execute the function to fix duplicates
SELECT fix_duplicate_slugs();

-- Drop the temporary function
DROP FUNCTION fix_duplicate_slugs();

-- Step 2: Update any NULL slugs with generated slugs
UPDATE mechanic_services 
SET slug = CASE 
  WHEN slug IS NULL THEN 
    regexp_replace(
      regexp_replace(
        regexp_replace(
          lower(name),
          '[ა-ჰ]', 
          CASE 
            WHEN position('ა' in lower(name)) > 0 THEN replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(name), 'ა', 'a'), 'ბ', 'b'), 'გ', 'g'), 'დ', 'd'), 'ე', 'e'), 'ვ', 'v'), 'ზ', 'z'), 'თ', 't'), 'ი', 'i'), 'კ', 'k'), 'ლ', 'l'), 'მ', 'm'), 'ნ', 'n'), 'ო', 'o'), 'პ', 'p'), 'ჟ', 'zh'), 'რ', 'r'), 'ს', 's'), 'ტ', 't'), 'უ', 'u'), 'ფ', 'p'), 'ქ', 'q'), 'ღ', 'gh'), 'ყ', 'q'), 'შ', 'sh'), 'ჩ', 'ch'), 'ც', 'ts'), 'ძ', 'dz'), 'წ', 'ts'), 'ჭ', 'ch'), 'ხ', 'kh'), 'ჯ', 'j'), 'ჰ', 'h')
            ELSE lower(name)
          END,
          'g'
        ),
        '[^\w\s-]', '', 'g'
      ),
      '[\s_]+', '-', 'g'
    )
  ELSE slug 
END
WHERE slug IS NULL;

-- Step 3: Ensure all slugs are unique by adding numbers to any remaining duplicates
DO $$
DECLARE
  service_record RECORD;
  base_slug TEXT;
  counter INTEGER;
  new_slug TEXT;
BEGIN
  -- Handle any services that still have duplicate slugs after the above fixes
  FOR service_record IN (
    SELECT id, slug, name,
           ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
    FROM mechanic_services 
    WHERE slug IS NOT NULL
  ) LOOP
    
    IF service_record.rn > 1 THEN
      base_slug := service_record.slug;
      counter := service_record.rn - 1;
      new_slug := base_slug || '-' || counter;
      
      -- Ensure this new slug is unique
      WHILE EXISTS (SELECT 1 FROM mechanic_services WHERE slug = new_slug AND id != service_record.id) LOOP
        counter := counter + 1;
        new_slug := base_slug || '-' || counter;
      END LOOP;
      
      UPDATE mechanic_services 
      SET slug = new_slug 
      WHERE id = service_record.id;
    END IF;
  END LOOP;
END;
$$;
-- Add slug_is_manual column (if not exists, skip if უკვე გაქვს)
ALTER TABLE mechanic_services ADD COLUMN IF NOT EXISTS slug_is_manual BOOLEAN DEFAULT false;

-- Create functions for transliteration and slug generation
CREATE OR REPLACE FUNCTION georgian_to_latin(text) RETURNS text AS $$
DECLARE
    georgian text := 'აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ';
    latin text := 'abgdevztiklmnopjrstufqgysshchcdzwtchxjh';
    result text := $1;
BEGIN
    FOR i IN 1..length(georgian) LOOP
        result := replace(result, substr(georgian, i, 1), substr(latin, i, 1));
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION generate_base_slug(name text) RETURNS text AS $$
BEGIN
    RETURN regexp_replace(
        regexp_replace(
            regexp_replace(
                lower(georgian_to_latin(name)),
                '[^\w\s-]', '', 'g'
            ),
            '[\s_]+', '-', 'g'
        ),
        '^-+|-+$', '', 'g'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION generate_unique_slug_enhanced(
    base_name text,
    exclude_id integer DEFAULT NULL
) RETURNS text AS $$
DECLARE
    base_slug text;
    new_slug text;
    counter integer := 0;
BEGIN
    base_slug := generate_base_slug(base_name);
    new_slug := base_slug;
    WHILE EXISTS (
        SELECT 1 FROM mechanic_services WHERE slug = new_slug AND id != COALESCE(exclude_id, -1)
    ) LOOP
        counter := counter + 1;
        new_slug := base_slug || '-' || counter;
    END LOOP;
    RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_generate_slug_mechanic_services() RETURNS trigger AS $$
BEGIN
    IF (NEW.slug IS NULL) OR 
       (NEW.name != OLD.name AND NOT COALESCE(OLD.slug_is_manual, false)) THEN
        NEW.slug := generate_unique_slug_enhanced(NEW.name, NEW.id);
        NEW.slug_is_manual := false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_generate_slug_mechanic_services ON mechanic_services;
CREATE TRIGGER trg_auto_generate_slug_mechanic_services
    BEFORE INSERT OR UPDATE ON mechanic_services
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_slug_mechanic_services();