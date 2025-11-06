-- Create community-media bucket if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'community-media') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'community-media',
      'community-media',
      TRUE,
      10485760, -- 10MB
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
    );
  END IF;
END $$;

-- RLS Policies for community-media bucket
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Anyone can view community media" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload community media" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own community media" ON storage.objects;
END $$;

-- Create policies
CREATE POLICY "Anyone can view community media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'community-media');

CREATE POLICY "Authenticated users can upload community media"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'community-media' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete own community media"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'community-media' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );