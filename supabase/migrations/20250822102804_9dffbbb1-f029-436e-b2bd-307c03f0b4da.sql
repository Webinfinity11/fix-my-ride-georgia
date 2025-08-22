-- Add a numeric display_id column to mechanic_profiles for cleaner URLs
ALTER TABLE public.mechanic_profiles 
ADD COLUMN display_id SERIAL UNIQUE;

-- Create index for better performance
CREATE INDEX idx_mechanic_profiles_display_id ON public.mechanic_profiles(display_id);

-- Update existing records to have display_id values
UPDATE public.mechanic_profiles 
SET display_id = nextval('mechanic_profiles_display_id_seq');

-- Make display_id not null after updating existing records
ALTER TABLE public.mechanic_profiles 
ALTER COLUMN display_id SET NOT NULL;