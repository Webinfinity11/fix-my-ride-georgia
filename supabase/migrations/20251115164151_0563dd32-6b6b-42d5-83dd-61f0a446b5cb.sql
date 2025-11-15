-- Add reviewed_by column to post_reports
ALTER TABLE post_reports ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id);

-- Create function to get active tags (tags with at least one non-deleted post)
CREATE OR REPLACE FUNCTION get_active_tags(tag_limit INT DEFAULT 15)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  use_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.slug,
    COUNT(DISTINCT pt.post_id) as use_count
  FROM tags t
  INNER JOIN post_tags pt ON pt.tag_id = t.id
  INNER JOIN posts p ON p.id = pt.post_id
  WHERE p.is_deleted = false
  GROUP BY t.id, t.name, t.slug
  HAVING COUNT(DISTINCT pt.post_id) > 0
  ORDER BY use_count DESC
  LIMIT tag_limit;
END;
$$;