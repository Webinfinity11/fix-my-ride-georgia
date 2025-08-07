-- Simple cleanup of malformed slugs

-- Update services with missing slugs
UPDATE mechanic_services 
SET slug = 'minebis-damuqeba-1' 
WHERE id = 315 AND (slug IS NULL OR slug = '');

UPDATE mechanic_services 
SET slug = 'minebis-damuqeba-2' 
WHERE id = 316 AND (slug IS NULL OR slug = '');

-- Fix extremely long slugs to be a maximum of 50 characters
UPDATE mechanic_services 
SET slug = SUBSTRING(slug FROM 1 FOR 50)
WHERE LENGTH(slug) > 100;

-- Clean up any remaining problematic patterns
UPDATE mechanic_services 
SET slug = REPLACE(REPLACE(slug, '--', '-'), '---', '-')
WHERE slug LIKE '%-%-%';

-- Remove leading/trailing hyphens
UPDATE mechanic_services 
SET slug = TRIM(BOTH '-' FROM slug)
WHERE slug LIKE '-%' OR slug LIKE '%-';