-- Fix pin functionality issues

-- 1. Create is_admin function that accepts user_id parameter
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE
    WHEN user_id IS NULL THEN FALSE
    ELSE EXISTS (
      SELECT 1 FROM profiles
      WHERE id = user_id AND role = 'admin'
    )
  END;
$$;

-- 2. Update get_community_feed to include pinned fields
DROP FUNCTION IF EXISTS get_community_feed(TEXT, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_community_feed(
    sort_by TEXT DEFAULT 'latest',
    filter_tag TEXT DEFAULT NULL,
    page_limit INTEGER DEFAULT 20,
    page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    post_id UUID,
    author_id UUID,
    author_name TEXT,
    author_avatar TEXT,
    content TEXT,
    media_url TEXT,
    media_type TEXT,
    thumbnail_url TEXT,
    tags JSONB,
    like_count BIGINT,
    comment_count BIGINT,
    is_liked BOOLEAN,
    is_saved BOOLEAN,
    created_at TIMESTAMPTZ,
    score INTEGER,
    is_pinned BOOLEAN,
    pinned_at TIMESTAMPTZ,
    pinned_by UUID
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS post_id,
        p.author_id,
        CONCAT(prof.first_name, ' ', prof.last_name) AS author_name,
        prof.avatar_url AS author_avatar,
        p.content,
        pm.media_url,
        pm.media_type,
        pm.thumbnail_url,
        COALESCE(
            json_agg(
                json_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'::json
        )::jsonb AS tags,
        COUNT(DISTINCT pl.id) AS like_count,
        COUNT(DISTINCT c.id) FILTER (WHERE c.is_deleted = FALSE) AS comment_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_likes.post_id = p.id AND post_likes.user_id = auth.uid()) AS is_liked,
        EXISTS(SELECT 1 FROM post_saves WHERE post_saves.post_id = p.id AND post_saves.user_id = auth.uid()) AS is_saved,
        p.created_at,
        p.score,
        COALESCE(p.is_pinned, FALSE) AS is_pinned,
        p.pinned_at,
        p.pinned_by
    FROM posts p
    INNER JOIN profiles prof ON p.author_id = prof.id
    LEFT JOIN post_media pm ON p.id = pm.post_id
    LEFT JOIN post_tags pt ON p.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    LEFT JOIN post_likes pl ON p.id = pl.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    WHERE
        p.is_deleted = FALSE
        AND (filter_tag IS NULL OR t.slug = filter_tag)
    GROUP BY
        p.id, p.author_id, prof.first_name, prof.last_name,
        prof.avatar_url, p.content, pm.media_url, pm.media_type,
        pm.thumbnail_url, p.created_at, p.score, p.is_pinned,
        p.pinned_at, p.pinned_by
    ORDER BY
        -- Pinned posts always first
        CASE WHEN p.is_pinned = TRUE THEN 0 ELSE 1 END,
        p.pinned_at DESC NULLS LAST,
        -- Then sort by specified criteria
        CASE
            WHEN sort_by = 'latest' THEN p.created_at
            ELSE NULL
        END DESC,
        CASE
            WHEN sort_by = 'top' THEN p.score
            ELSE NULL
        END DESC,
        CASE
            WHEN sort_by = 'top' THEN p.last_interacted_at
            ELSE NULL
        END DESC
    LIMIT page_limit
    OFFSET page_offset;
END;
$$;
