-- Track service detail page views (mirrors service_phone_views).
-- Enables view counts + view→call conversion analytics.
-- Idempotent: safe to run more than once.

CREATE TABLE IF NOT EXISTS public.service_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id INTEGER NOT NULL REFERENCES public.mechanic_services(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_views_service_id ON public.service_views(service_id);
CREATE INDEX IF NOT EXISTS idx_service_views_created_at ON public.service_views(created_at);
CREATE INDEX IF NOT EXISTS idx_service_views_viewer_id ON public.service_views(viewer_id);

ALTER TABLE public.service_views ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anonymous) can record a view
DROP POLICY IF EXISTS "Anyone can insert service views" ON public.service_views;
CREATE POLICY "Anyone can insert service views"
ON public.service_views
FOR INSERT
WITH CHECK (true);

-- Only the service owner and admins can read views
DROP POLICY IF EXISTS "Service owners and admins can view service views" ON public.service_views;
CREATE POLICY "Service owners and admins can view service views"
ON public.service_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.mechanic_services
    WHERE mechanic_services.id = service_views.service_id
    AND mechanic_services.mechanic_id = auth.uid()
  )
  OR public.is_admin(auth.uid())
);
