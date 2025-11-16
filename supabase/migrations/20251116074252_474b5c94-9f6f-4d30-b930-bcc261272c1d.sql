-- Allow admins to update all posts (for soft delete and pinning)
CREATE POLICY "Admins can update all posts"
ON posts FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Add pinning columns to posts table
ALTER TABLE posts 
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS pinned_by UUID REFERENCES profiles(id);

-- Create index for pinned posts
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON posts(is_pinned, pinned_at DESC) 
  WHERE is_pinned = true AND is_deleted = false;