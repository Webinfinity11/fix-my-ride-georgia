-- Add slug column to mechanic_services table
ALTER TABLE public.mechanic_services 
ADD COLUMN slug TEXT;

-- Create index on slug for better performance
CREATE INDEX idx_mechanic_services_slug ON public.mechanic_services(slug);

-- Update existing services to generate slugs
-- This will be done programmatically from the frontend to handle conflicts properly