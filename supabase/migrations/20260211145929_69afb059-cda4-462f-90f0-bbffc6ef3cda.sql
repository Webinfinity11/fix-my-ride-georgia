
-- Create banner analytics table
CREATE TABLE public.banner_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  banner_id uuid NOT NULL REFERENCES public.site_banners(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('impression', 'click')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address inet DEFAULT NULL,
  user_agent text DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.banner_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (tracking)
CREATE POLICY "Anyone can track banner events"
ON public.banner_analytics FOR INSERT
WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read banner analytics"
ON public.banner_analytics FOR SELECT
USING (public.is_current_user_admin());

-- Index for fast aggregation
CREATE INDEX idx_banner_analytics_banner_id ON public.banner_analytics(banner_id);
CREATE INDEX idx_banner_analytics_event_type ON public.banner_analytics(banner_id, event_type);

-- Aggregation function for admin
CREATE OR REPLACE FUNCTION public.get_banner_stats()
RETURNS TABLE(banner_id uuid, impressions bigint, clicks bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT 
    ba.banner_id,
    COUNT(*) FILTER (WHERE ba.event_type = 'impression') as impressions,
    COUNT(*) FILTER (WHERE ba.event_type = 'click') as clicks
  FROM banner_analytics ba
  GROUP BY ba.banner_id;
$$;
