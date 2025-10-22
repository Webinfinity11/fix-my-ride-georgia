-- Create service_phone_views table for tracking phone number view clicks
CREATE TABLE IF NOT EXISTS service_phone_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id INTEGER NOT NULL REFERENCES mechanic_services(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_phone_views_service_id ON service_phone_views(service_id);
CREATE INDEX IF NOT EXISTS idx_service_phone_views_created_at ON service_phone_views(created_at);
CREATE INDEX IF NOT EXISTS idx_service_phone_views_viewer_id ON service_phone_views(viewer_id);

-- Enable RLS
ALTER TABLE service_phone_views ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can insert phone views (including anonymous users)
CREATE POLICY "Anyone can insert phone views"
ON service_phone_views
FOR INSERT
WITH CHECK (true);

-- RLS Policy: Service owners and admins can view phone views
CREATE POLICY "Service owners and admins can view phone views"
ON service_phone_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM mechanic_services 
    WHERE mechanic_services.id = service_phone_views.service_id 
    AND mechanic_services.mechanic_id = auth.uid()
  )
  OR is_admin(auth.uid())
);