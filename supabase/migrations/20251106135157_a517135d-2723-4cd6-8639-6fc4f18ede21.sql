-- ===================================
-- PHASE 1: Security Enhancement - User Roles
-- ===================================

-- 1. Create app_role enum with moderator role
CREATE TYPE public.app_role AS ENUM ('customer', 'mechanic', 'admin', 'moderator');

-- 2. Create user_roles table for secure role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for user_roles
CREATE POLICY "Anyone can view user roles"
    ON public.user_roles FOR SELECT
    USING (TRUE);

CREATE POLICY "Only admins can insert user roles"
    ON public.user_roles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

-- 5. Security Definer Functions for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_moderator_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('admin', 'moderator')
  );
$$;

-- 6. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT id, 
       CASE 
         WHEN role = 'customer' THEN 'customer'::app_role
         WHEN role = 'mechanic' THEN 'mechanic'::app_role
         WHEN role = 'admin' THEN 'admin'::app_role
         ELSE 'customer'::app_role
       END,
       created_at
FROM public.profiles
WHERE id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- ===================================
-- PHASE 2: Community Tables
-- ===================================

-- 1. Posts Table
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT CHECK (char_length(content) <= 1000),
    is_deleted BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_interacted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_score ON posts(score DESC, last_interacted_at DESC);
CREATE INDEX idx_posts_not_deleted ON posts(is_deleted) WHERE is_deleted = FALSE;

-- 2. Post Media Table
CREATE TABLE public.post_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id)
);

CREATE INDEX idx_post_media_post ON post_media(post_id);

-- 3. Tags Table
CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_use_count ON tags(use_count DESC);

-- 4. Post Tags Junction Table
CREATE TABLE public.post_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, tag_id)
);

CREATE INDEX idx_post_tags_post ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag ON post_tags(tag_id);

-- Tag limit constraint
CREATE OR REPLACE FUNCTION check_post_tag_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM post_tags WHERE post_id = NEW.post_id) >= 5 THEN
        RAISE EXCEPTION 'პოსტს მაქსიმუმ 5 თაგი შეიძლება დაემატოს';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_post_tag_limit
    BEFORE INSERT ON post_tags
    FOR EACH ROW EXECUTE FUNCTION check_post_tag_limit();

-- 5. Post Likes
CREATE TABLE public.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_user ON post_likes(user_id);

-- 6. Post Saves
CREATE TABLE public.post_saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_saves_user ON post_saves(user_id);
CREATE INDEX idx_post_saves_post ON post_saves(post_id);

-- 7. Comments
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 500),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id, created_at);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- 8. Post Reports
CREATE TYPE report_reason AS ENUM ('spam', 'offensive', 'personal', 'sensitive', 'other');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'hidden', 'deleted', 'dismissed');

CREATE TABLE public.post_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason report_reason NOT NULL,
    details TEXT,
    status report_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, reporter_id)
);

CREATE INDEX idx_reports_status ON post_reports(status, created_at DESC);
CREATE INDEX idx_reports_post ON post_reports(post_id);

-- ===================================
-- PHASE 3: Triggers
-- ===================================

-- Update post score when likes/comments change
CREATE OR REPLACE FUNCTION update_post_score()
RETURNS TRIGGER AS $$
DECLARE
    target_post_id UUID;
BEGIN
    target_post_id := COALESCE(NEW.post_id, OLD.post_id);
    
    UPDATE posts SET
        score = (
            SELECT COALESCE(COUNT(DISTINCT pl.id), 0) + (COALESCE(COUNT(DISTINCT c.id), 0) * 2)
            FROM posts p
            LEFT JOIN post_likes pl ON p.id = pl.post_id
            LEFT JOIN comments c ON p.id = c.post_id AND c.is_deleted = FALSE
            WHERE p.id = target_post_id
        ),
        last_interacted_at = NOW()
    WHERE id = target_post_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_likes_score_update
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_score();

CREATE TRIGGER comments_score_update
    AFTER INSERT OR DELETE OR UPDATE OF is_deleted ON comments
    FOR EACH ROW EXECUTE FUNCTION update_post_score();

-- Increment tag use_count
CREATE OR REPLACE FUNCTION increment_tag_use_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tags SET use_count = use_count + 1
    WHERE id = NEW.tag_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_tag_use_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tags SET use_count = GREATEST(0, use_count - 1)
    WHERE id = OLD.tag_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tag_use_increment
    AFTER INSERT ON post_tags
    FOR EACH ROW EXECUTE FUNCTION increment_tag_use_count();

CREATE TRIGGER tag_use_decrement
    AFTER DELETE ON post_tags
    FOR EACH ROW EXECUTE FUNCTION decrement_tag_use_count();

-- ===================================
-- PHASE 4: Row Level Security
-- ===================================

-- Posts RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-deleted posts"
    ON posts FOR SELECT
    USING (is_deleted = FALSE);

CREATE POLICY "Authenticated users can create posts"
    ON posts FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts"
    ON posts FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Authors or moderators can delete posts"
    ON posts FOR DELETE
    USING (
        auth.uid() = author_id 
        OR is_moderator_or_admin(auth.uid())
    );

-- Post Media RLS
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post media"
    ON post_media FOR SELECT
    USING (TRUE);

CREATE POLICY "Post authors can add media"
    ON post_media FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts 
            WHERE posts.id = post_media.post_id 
            AND posts.author_id = auth.uid()
        )
    );

CREATE POLICY "Authors or moderators can delete media"
    ON post_media FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM posts 
            WHERE posts.id = post_media.post_id 
            AND (posts.author_id = auth.uid() OR is_moderator_or_admin(auth.uid()))
        )
    );

-- Post Likes RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
    ON post_likes FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can like posts"
    ON post_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
    ON post_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Post Saves RLS
ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saves"
    ON post_saves FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
    ON post_saves FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts"
    ON post_saves FOR DELETE
    USING (auth.uid() = user_id);

-- Comments RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-deleted comments"
    ON comments FOR SELECT
    USING (is_deleted = FALSE);

CREATE POLICY "Authenticated users can comment"
    ON comments FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own comments"
    ON comments FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Authors or moderators can delete comments"
    ON comments FOR DELETE
    USING (
        auth.uid() = author_id 
        OR is_moderator_or_admin(auth.uid())
    );

-- Post Reports RLS
ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can view reports"
    ON post_reports FOR SELECT
    USING (is_moderator_or_admin(auth.uid()));

CREATE POLICY "Users can report posts"
    ON post_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Moderators can update reports"
    ON post_reports FOR UPDATE
    USING (is_moderator_or_admin(auth.uid()));

-- Tags & Post Tags RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tags" 
    ON tags FOR SELECT 
    USING (TRUE);

CREATE POLICY "Anyone can view post tags" 
    ON post_tags FOR SELECT 
    USING (TRUE);

CREATE POLICY "Authenticated users can create tags" 
    ON tags FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Post authors can add tags"
    ON post_tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts 
            WHERE posts.id = post_tags.post_id 
            AND posts.author_id = auth.uid()
        )
    );

CREATE POLICY "Post authors can remove tags"
    ON post_tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM posts 
            WHERE posts.id = post_tags.post_id 
            AND posts.author_id = auth.uid()
        )
    );

-- ===================================
-- PHASE 5: RPC Functions
-- ===================================

-- Get Community Feed
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
    score INTEGER
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS post_id,
        p.author_id,
        COALESCE(prof.first_name || ' ' || prof.last_name, 'User') AS author_name,
        prof.avatar_url AS author_avatar,
        p.content,
        pm.media_url,
        pm.media_type,
        pm.thumbnail_url,
        COALESCE(
            jsonb_agg(
                jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'::jsonb
        ) AS tags,
        COUNT(DISTINCT pl.id) AS like_count,
        COUNT(DISTINCT c.id) FILTER (WHERE c.is_deleted = FALSE) AS comment_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = auth.uid()) AS is_liked,
        EXISTS(SELECT 1 FROM post_saves WHERE post_id = p.id AND user_id = auth.uid()) AS is_saved,
        p.created_at,
        p.score
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
        pm.thumbnail_url, p.created_at, p.score
    ORDER BY 
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

-- Get Single Post Details
CREATE OR REPLACE FUNCTION get_post_details(post_uuid UUID)
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
    view_count INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE posts SET view_count = view_count + 1 WHERE id = post_uuid;
    
    RETURN QUERY
    SELECT 
        p.id AS post_id,
        p.author_id,
        COALESCE(prof.first_name || ' ' || prof.last_name, 'User') AS author_name,
        prof.avatar_url AS author_avatar,
        p.content,
        pm.media_url,
        pm.media_type,
        pm.thumbnail_url,
        COALESCE(
            jsonb_agg(
                jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'::jsonb
        ) AS tags,
        COUNT(DISTINCT pl.id) AS like_count,
        COUNT(DISTINCT c.id) FILTER (WHERE c.is_deleted = FALSE) AS comment_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = auth.uid()) AS is_liked,
        EXISTS(SELECT 1 FROM post_saves WHERE post_id = p.id AND user_id = auth.uid()) AS is_saved,
        p.created_at,
        p.view_count
    FROM posts p
    INNER JOIN profiles prof ON p.author_id = prof.id
    LEFT JOIN post_media pm ON p.id = pm.post_id
    LEFT JOIN post_tags pt ON p.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    LEFT JOIN post_likes pl ON p.id = pl.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    WHERE p.id = post_uuid AND p.is_deleted = FALSE
    GROUP BY 
        p.id, prof.first_name, prof.last_name, prof.avatar_url,
        p.content, pm.media_url, pm.media_type, pm.thumbnail_url,
        p.created_at, p.view_count;
END;
$$;