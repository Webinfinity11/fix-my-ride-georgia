-- Fix security warnings for functions

-- Fix function search path for update_service_rating
CREATE OR REPLACE FUNCTION public.update_service_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.mechanic_services
  SET 
    rating = (
      SELECT AVG(rating)::numeric(3,2) 
      FROM public.service_reviews 
      WHERE service_id = NEW.service_id
    ),
    review_count = (
      SELECT COUNT(*) 
      FROM public.service_reviews 
      WHERE service_id = NEW.service_id
    )
  WHERE id = NEW.service_id;
  RETURN NEW;
END;
$function$;

-- Fix function search path for update_mechanic_rating  
CREATE OR REPLACE FUNCTION public.update_mechanic_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.mechanic_profiles
  SET 
    rating = (
      SELECT AVG(rating)::numeric(3,2) 
      FROM public.reviews 
      WHERE mechanic_id = NEW.mechanic_id
    ),
    review_count = (
      SELECT COUNT(*) 
      FROM public.reviews 
      WHERE mechanic_id = NEW.mechanic_id
    )
  WHERE id = NEW.mechanic_id;
  RETURN NEW;
END;
$function$;