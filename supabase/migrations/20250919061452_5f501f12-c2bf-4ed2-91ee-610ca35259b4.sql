-- Create or replace trigger function to update sitemap when content changes
CREATE OR REPLACE FUNCTION public.trigger_sitemap_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Use pg_notify to signal sitemap update needed
  PERFORM pg_notify('sitemap_update', json_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'timestamp', now()
  )::text);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_sitemap_on_services ON public.mechanic_services;
DROP TRIGGER IF EXISTS trigger_sitemap_on_categories ON public.service_categories;
DROP TRIGGER IF EXISTS trigger_sitemap_on_profiles ON public.profiles;

-- Create triggers for automatic sitemap updates
CREATE TRIGGER trigger_sitemap_on_services
  AFTER INSERT OR UPDATE OR DELETE ON public.mechanic_services
  FOR EACH ROW
  WHEN (OLD IS DISTINCT FROM NEW OR TG_OP = 'DELETE')
  EXECUTE FUNCTION public.trigger_sitemap_update();

CREATE TRIGGER trigger_sitemap_on_categories
  AFTER INSERT OR UPDATE OR DELETE ON public.service_categories
  FOR EACH ROW
  WHEN (OLD IS DISTINCT FROM NEW OR TG_OP = 'DELETE')
  EXECUTE FUNCTION public.trigger_sitemap_update();

CREATE TRIGGER trigger_sitemap_on_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  WHEN (
    (OLD IS DISTINCT FROM NEW OR TG_OP = 'DELETE') 
    AND (NEW.role = 'mechanic' OR OLD.role = 'mechanic')
    AND (NEW.is_verified = true OR OLD.is_verified = true)
  )
  EXECUTE FUNCTION public.trigger_sitemap_update();