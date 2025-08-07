-- Fix missing and duplicate slugs for services
UPDATE mechanic_services 
SET slug = 'minebis-damuqeba-1' 
WHERE id = 315 AND slug IS NULL;

UPDATE mechanic_services 
SET slug = 'minebis-damuqeba-2' 
WHERE id = 316 AND slug IS NULL;

-- Fix malformed long slugs by generating proper ones
UPDATE mechanic_services 
SET slug = 'minebis-damuqeba-3' 
WHERE id = 49 AND LENGTH(slug) > 50;

UPDATE mechanic_services 
SET slug = 'minebis-damuqeba-4' 
WHERE id = 277 AND LENGTH(slug) > 50;

UPDATE mechanic_services 
SET slug = 'minebis-damuqeba-5' 
WHERE id = 305 AND LENGTH(slug) > 50;