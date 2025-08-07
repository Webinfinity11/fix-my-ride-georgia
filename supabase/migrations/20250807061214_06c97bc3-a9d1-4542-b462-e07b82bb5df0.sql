-- 🚀 სრული Duplicate Slug-ების გამსწორებელი Script
-- Supabase SQL Editor-ში ჩალაგეთ და Run დააჭირეთ

-- Step 1: Create function to fix all duplicate slugs
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
    
    RAISE NOTICE 'Processing duplicate slug: %, Count: %', dup_record.slug, array_length(dup_record.service_ids, 1);
    
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
      SET slug = new_slug, 
          updated_at = NOW()
      WHERE id = service_record.id;
      
      RAISE NOTICE 'Updated service ID %: "%" -> "%"', service_record.id, service_record.name, new_slug;
      
      counter := counter + 1;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'All duplicate slugs have been fixed successfully!';
END;
$$ LANGUAGE plpgsql;

-- Execute the function to fix duplicates
SELECT fix_duplicate_slugs();

-- Drop the temporary function (cleanup)
DROP FUNCTION IF EXISTS fix_duplicate_slugs();

-- Step 2: Fix any NULL or empty slugs with auto-generated slugs
UPDATE mechanic_services 
SET slug = regexp_replace(
    regexp_replace(
      regexp_replace(
        lower(trim(name)),
        -- Georgian to Latin transliteration
        'ა', 'a', 'g'
      ),
      'ბ', 'b', 'g'
    ) ||
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(
                    regexp_replace(
                      regexp_replace(
                        regexp_replace(
                          regexp_replace(
                            regexp_replace(
                              regexp_replace(
                                regexp_replace(
                                  regexp_replace(
                                    regexp_replace(
                                      regexp_replace(
                                        regexp_replace(
                                          regexp_replace(
                                            regexp_replace(
                                              regexp_replace(
                                                regexp_replace(
                                                  regexp_replace(
                                                    regexp_replace(
                                                      regexp_replace(
                                                        regexp_replace(
                                                          regexp_replace(
                                                            regexp_replace(
                                                              regexp_replace(
                                                                lower(trim(name)), 
                                                                'გ', 'g', 'g'
                                                              ), 'დ', 'd', 'g'
                                                            ), 'ე', 'e', 'g'
                                                          ), 'ვ', 'v', 'g'
                                                        ), 'ზ', 'z', 'g'
                                                      ), 'თ', 't', 'g'
                                                    ), 'ი', 'i', 'g'
                                                  ), 'კ', 'k', 'g'
                                                ), 'ლ', 'l', 'g'
                                              ), 'მ', 'm', 'g'
                                            ), 'ნ', 'n', 'g'
                                          ), 'ო', 'o', 'g'
                                        ), 'პ', 'p', 'g'
                                      ), 'ჟ', 'zh', 'g'
                                    ), 'რ', 'r', 'g'
                                  ), 'ს', 's', 'g'
                                ), 'ტ', 't', 'g'
                              ), 'უ', 'u', 'g'
                            ), 'ფ', 'f', 'g'
                          ), 'ქ', 'q', 'g'
                        ), 'ღ', 'gh', 'g'
                      ), 'ყ', 'q', 'g'
                    ), 'შ', 'sh', 'g'
                  ), 'ჩ', 'ch', 'g'
                ), 'ც', 'ts', 'g'
              ), 'ძ', 'dz', 'g'
            ), 'წ', 'ts', 'g'
          ), 'ჭ', 'ch', 'g'
        ), 'ხ', 'kh', 'g'
      ), 'ჯ', 'j', 'g'
    ), 'ჰ', 'h', 'g'
  ),
  '[^a-z0-9\s-]', '', 'g'  -- Remove special characters
),
'[\s_]+', '-', 'g'  -- Replace spaces with hyphens
),
'^-+|-+$', '', 'g'  -- Remove leading/trailing hyphens
) || CASE 
  WHEN LENGTH(trim(name)) = 0 THEN '-service-' || id::text 
  ELSE '' 
END,
updated_at = NOW()
WHERE slug IS NULL 
   OR slug = '' 
   OR trim(slug) = ''
   OR slug = 'undefined'
   OR slug = 'null';

-- Step 3: Final cleanup - ensure ALL slugs are unique using ROW_NUMBER
DO $$
DECLARE
  service_record RECORD;
  base_slug TEXT;
  counter INTEGER;
  new_slug TEXT;
  fixed_count INTEGER := 0;
BEGIN
  -- Handle any services that still have duplicate slugs after the above fixes
  FOR service_record IN (
    SELECT id, slug, name,
           ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at, id) as rn
    FROM mechanic_services 
    WHERE slug IS NOT NULL 
      AND trim(slug) != ''
    ORDER BY slug, created_at, id
  ) LOOP
    
    -- Only process duplicates (rn > 1)
    IF service_record.rn > 1 THEN
      base_slug := service_record.slug;
      counter := service_record.rn - 1;
      new_slug := base_slug || '-' || counter;
      
      -- Ensure this new slug is unique across the entire table
      WHILE EXISTS (
        SELECT 1 FROM mechanic_services 
        WHERE slug = new_slug 
          AND id != service_record.id
      ) LOOP
        counter := counter + 1;
        new_slug := base_slug || '-' || counter;
      END LOOP;
      
      -- Update the service with the new unique slug
      UPDATE mechanic_services 
      SET slug = new_slug,
          updated_at = NOW()
      WHERE id = service_record.id;
      
      fixed_count := fixed_count + 1;
      
      RAISE NOTICE 'Fixed final duplicate: Service ID % "%" -> "%"', 
        service_record.id, service_record.name, new_slug;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Final cleanup completed. Fixed % additional duplicates.', fixed_count;
END;
$$;

-- Step 4: Verification - Check results
DO $$
DECLARE
  duplicate_count INTEGER;
  null_count INTEGER;
  total_count INTEGER;
  unique_count INTEGER;
BEGIN
  -- Check for remaining duplicates
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT slug 
    FROM mechanic_services 
    WHERE slug IS NOT NULL
    GROUP BY slug 
    HAVING COUNT(*) > 1
  ) duplicates;
  
  -- Check for NULL slugs
  SELECT COUNT(*) INTO null_count
  FROM mechanic_services 
  WHERE slug IS NULL OR trim(slug) = '';
  
  -- Get totals
  SELECT COUNT(*) INTO total_count FROM mechanic_services;
  SELECT COUNT(DISTINCT slug) INTO unique_count FROM mechanic_services WHERE slug IS NOT NULL;
  
  -- Report results
  RAISE NOTICE '=== VERIFICATION RESULTS ===';
  RAISE NOTICE 'Total services: %', total_count;
  RAISE NOTICE 'Unique slugs: %', unique_count;
  RAISE NOTICE 'Remaining duplicates: %', duplicate_count;
  RAISE NOTICE 'NULL/empty slugs: %', null_count;
  
  IF duplicate_count = 0 AND null_count = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All slugs are now unique!';
  ELSE
    RAISE NOTICE '⚠️ WARNING: Issues still remain!';
  END IF;
END;
$$;

-- Step 5: Display final slug status
SELECT 
  'FINAL RESULTS' as status,
  COUNT(*) as total_services,
  COUNT(DISTINCT slug) as unique_slugs,
  COUNT(*) - COUNT(DISTINCT slug) as duplicate_count,
  COUNT(*) FILTER (WHERE slug IS NULL OR trim(slug) = '') as null_or_empty
FROM mechanic_services;

-- Optional: Show first 10 services to verify
SELECT 
  id, 
  name, 
  slug,
  created_at,
  updated_at
FROM mechanic_services 
ORDER BY id 
LIMIT 10;