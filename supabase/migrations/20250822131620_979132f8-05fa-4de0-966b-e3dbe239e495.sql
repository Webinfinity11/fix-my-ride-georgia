-- Create database triggers for automatic sitemap updates

-- Function to call sitemap generation edge function
CREATE OR REPLACE FUNCTION public.trigger_sitemap_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- We'll use pg_net to call our edge function
  -- This will be called whenever services, categories, or profiles change
  PERFORM net.http_post(
    url := 'https://kwozniwtygkdoagjegom.supabase.co/functions/v1/generate-sitemap',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3b3puaXd0eWdrZG9hZ2plZ29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgzOTcyMiwiZXhwIjoyMDYzNDE1NzIyfQ.LgQBajkgMQCLqjjXPRHg-0lLwFkXMeq_xGLR2K7p9tE"}'::jsonb,
    body := '{"trigger": "database_change"}'::jsonb
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger for mechanic_services table
DROP TRIGGER IF EXISTS sitemap_update_services ON mechanic_services;
CREATE TRIGGER sitemap_update_services
  AFTER INSERT OR UPDATE OR DELETE ON mechanic_services
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sitemap_update();

-- Trigger for service_categories table  
DROP TRIGGER IF EXISTS sitemap_update_categories ON service_categories;
CREATE TRIGGER sitemap_update_categories
  AFTER INSERT OR UPDATE OR DELETE ON service_categories
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sitemap_update();

-- Trigger for profiles table (mechanics only)
DROP TRIGGER IF EXISTS sitemap_update_mechanics ON profiles;
CREATE TRIGGER sitemap_update_mechanics
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW
  WHEN (OLD.role = 'mechanic' OR NEW.role = 'mechanic')
  EXECUTE FUNCTION trigger_sitemap_update();