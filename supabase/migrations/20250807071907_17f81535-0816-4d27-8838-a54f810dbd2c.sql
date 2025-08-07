-- Final cleanup of all slugs in the database

-- Fix empty slugs first
UPDATE mechanic_services 
SET slug = CASE 
  WHEN id = 315 THEN 'minebis-damuqeba-1'
  WHEN id = 316 THEN 'minebis-damuqeba-2'
  ELSE CONCAT(
    LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                REGEXP_REPLACE(
                  REGEXP_REPLACE(
                    REGEXP_REPLACE(
                      REGEXP_REPLACE(
                        REGEXP_REPLACE(
                          REGEXP_REPLACE(
                            REGEXP_REPLACE(
                              REGEXP_REPLACE(
                                REGEXP_REPLACE(
                                  REGEXP_REPLACE(
                                    REGEXP_REPLACE(
                                      name,
                                      'ა', 'a', 'g'
                                    ), 'ბ', 'b', 'g'
                                  ), 'გ', 'g', 'g'
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
        ), 'რ', 'r', 'g'
      ), 'ს', 's', 'g'
    ),
    '-', EXTRACT(EPOCH FROM now())::bigint % 10000
  )
END
WHERE slug IS NULL OR slug = '';

-- Fix extremely long slugs
UPDATE mechanic_services 
SET slug = SUBSTRING(slug FROM 1 FOR 50)
WHERE LENGTH(slug) > 100;

-- Remove duplicate suffix patterns in existing slugs 
UPDATE mechanic_services 
SET slug = REGEXP_REPLACE(slug, '(.+?)-\1.*', '\1', 'g')
WHERE slug ~ '.+-\1';

-- Ensure uniqueness by adding incremental numbers where needed
WITH numbered_services AS (
  SELECT 
    id,
    slug,
    ROW_NUMBER() OVER (
      PARTITION BY REGEXP_REPLACE(slug, '-\d+$', '') 
      ORDER BY created_at
    ) - 1 as row_num
  FROM mechanic_services 
  WHERE is_active = true AND slug IS NOT NULL
)
UPDATE mechanic_services 
SET slug = CASE 
  WHEN numbered_services.row_num = 0 THEN REGEXP_REPLACE(numbered_services.slug, '-\d+$', '')
  ELSE REGEXP_REPLACE(numbered_services.slug, '-\d+$', '') || '-' || numbered_services.row_num
END
FROM numbered_services 
WHERE mechanic_services.id = numbered_services.id;