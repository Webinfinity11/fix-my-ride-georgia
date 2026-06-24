-- Track mechanic phone-call clicks (mechanic card + profile), mirrors service_phone_views.
-- Idempotent: safe to run more than once.

CREATE TABLE IF NOT EXISTS public.mechanic_phone_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mechanic_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mechanic_phone_views_mechanic_id ON public.mechanic_phone_views(mechanic_id);
CREATE INDEX IF NOT EXISTS idx_mechanic_phone_views_created_at ON public.mechanic_phone_views(created_at);
CREATE INDEX IF NOT EXISTS idx_mechanic_phone_views_viewer_id ON public.mechanic_phone_views(viewer_id);

ALTER TABLE public.mechanic_phone_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert mechanic phone views" ON public.mechanic_phone_views;
CREATE POLICY "Anyone can insert mechanic phone views"
ON public.mechanic_phone_views
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Owners and admins can view mechanic phone views" ON public.mechanic_phone_views;
CREATE POLICY "Owners and admins can view mechanic phone views"
ON public.mechanic_phone_views
FOR SELECT
USING (mechanic_id = auth.uid() OR public.is_admin(auth.uid()));
