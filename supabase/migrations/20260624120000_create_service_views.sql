-- Track service detail page views (mirrors service_phone_views).
-- Enables view counts + view→call conversion analytics.
CREATE TABLE IF NOT EXISTS service_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id INTEGER NOT NULL REFERENCES mechanic_services(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_views_service_id ON service_views(service_id);
CREATE INDEX IF NOT EXISTS idx_service_views_created_at ON service_views(created_at);
CREATE INDEX IF NOT EXISTS idx_service_views_viewer_id ON service_views(viewer_id);

ALTER TABLE service_views ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anonymous) can record a view
CREATE POLICY "Anyone can insert service views"
ON service_views
FOR INSERT
WITH CHECK (true);

-- Only the service owner and admins can read views
CREATE POLICY "Service owners and admins can view service views"
ON service_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM mechanic_services
    WHERE mechanic_services.id = service_views.service_id
    AND mechanic_services.mechanic_id = auth.uid()
  )
  OR is_admin(auth.uid())
);
