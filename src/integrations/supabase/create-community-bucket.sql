-- Create community-media bucket for post images and videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-media',
  'community-media',
  TRUE,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
);

-- RLS Policies for community-media bucket
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
