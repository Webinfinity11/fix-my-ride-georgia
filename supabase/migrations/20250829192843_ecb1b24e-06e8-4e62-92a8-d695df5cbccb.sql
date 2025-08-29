-- Fix security warnings by setting search_path for functions

-- Drop and recreate the functions with proper security settings
DROP FUNCTION IF EXISTS public.update_full_name();
DROP FUNCTION IF EXISTS public.update_full_address();

-- Create function to combine first_name and last_name into full_name with proper search_path
CREATE OR REPLACE FUNCTION public.update_full_name()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
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
$$;

-- Create function to combine address fields into full_address with proper search_path
CREATE OR REPLACE FUNCTION public.update_full_address()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
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
$$;