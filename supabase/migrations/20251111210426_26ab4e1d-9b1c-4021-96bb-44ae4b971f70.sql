-- Fix RLS policies for community features
-- The existing is_admin() and is_current_user_admin() functions already check profiles.role

-- Update posts table policies to allow admins to delete
DROP POLICY IF EXISTS "Authors or moderators can delete posts" ON posts;
CREATE POLICY "Authors or admins can delete posts"
ON posts FOR DELETE
USING (
  auth.uid() = author_id 
  OR is_admin(auth.uid())
);

-- Update comments policies to allow admins to delete
DROP POLICY IF EXISTS "Authors or moderators can delete comments" ON comments;
CREATE POLICY "Authors or admins can delete comments"
ON comments FOR DELETE
USING (
  auth.uid() = author_id 
  OR is_admin(auth.uid())
);

-- Update post_media policies to allow admins to delete
DROP POLICY IF EXISTS "Authors or moderators can delete media" ON post_media;
CREATE POLICY "Authors or admins can delete media"
ON post_media FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM posts 
    WHERE posts.id = post_media.post_id 
    AND (posts.author_id = auth.uid() OR is_admin(auth.uid()))
  )
);

-- Update post_reports policies to use correct admin check
DROP POLICY IF EXISTS "Moderators can view reports" ON post_reports;
CREATE POLICY "Admins can view reports"
ON post_reports FOR SELECT
USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Moderators can update reports" ON post_reports;
CREATE POLICY "Admins can update reports"
ON post_reports FOR UPDATE
USING (is_admin(auth.uid()));