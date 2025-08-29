-- Add new columns for combined name and address
ALTER TABLE public.profiles 
ADD COLUMN full_name TEXT,
ADD COLUMN full_address TEXT;

-- Create function to combine first_name and last_name into full_name
CREATE OR REPLACE FUNCTION public.update_full_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If full_name is not provided but first_name and last_name are, combine them
  IF NEW.full_name IS NULL AND NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
    NEW.full_name := trim(NEW.first_name || ' ' || NEW.last_name);
  END IF;
  
  -- If full_name is provided but first_name and last_name are not, split them
  IF NEW.full_name IS NOT NULL AND (NEW.first_name IS NULL OR NEW.last_name IS NULL) THEN
    -- Simple split on first space
    NEW.first_name := split_part(NEW.full_name, ' ', 1);
    NEW.last_name := trim(substring(NEW.full_name from position(' ' in NEW.full_name) + 1));
    -- If no space found, put everything in first_name
    IF NEW.last_name = '' THEN
      NEW.last_name := NEW.first_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to combine address fields into full_address
CREATE OR REPLACE FUNCTION public.update_full_address()
RETURNS TRIGGER AS $$
BEGIN
  -- If full_address is not provided but individual address fields are, combine them
  IF NEW.full_address IS NULL THEN
    NEW.full_address := trim(
      COALESCE(NEW.city, '') ||
      CASE WHEN NEW.district IS NOT NULL THEN ', ' || NEW.district ELSE '' END ||
      CASE WHEN NEW.street IS NOT NULL THEN ', ' || NEW.street ELSE '' END ||
      CASE WHEN NEW.building IS NOT NULL THEN ', ' || NEW.building ELSE '' END ||
      CASE WHEN NEW.apartment IS NOT NULL THEN ', ბინა ' || NEW.apartment ELSE '' END
    );
    -- If result is empty or just commas, set to null
    IF NEW.full_address = '' OR NEW.full_address ~ '^[,\s]*$' THEN
      NEW.full_address := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically sync the fields
CREATE TRIGGER trigger_update_full_name
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_full_name();

CREATE TRIGGER trigger_update_full_address
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_full_address();

-- Migrate existing data to populate full_name and full_address
UPDATE public.profiles 
SET 
  full_name = trim(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')),
  full_address = trim(
    COALESCE(city, '') ||
    CASE WHEN district IS NOT NULL THEN ', ' || district ELSE '' END ||
    CASE WHEN street IS NOT NULL THEN ', ' || street ELSE '' END ||
    CASE WHEN building IS NOT NULL THEN ', ' || building ELSE '' END ||
    CASE WHEN apartment IS NOT NULL THEN ', ბინა ' || apartment ELSE '' END
  )
WHERE full_name IS NULL OR full_address IS NULL;

-- Clean up empty full_address values
UPDATE public.profiles 
SET full_address = NULL 
WHERE full_address = '' OR full_address ~ '^[,\s]*$';