-- Drop existing check constraint on position and add services_page
ALTER TABLE public.site_banners DROP CONSTRAINT IF EXISTS site_banners_position_check;
ALTER TABLE public.site_banners ADD CONSTRAINT site_banners_position_check 
  CHECK (position IN ('home_center_desktop', 'home_above_mobile_nav', 'services_page'));