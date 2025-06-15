
-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload chat files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat files" ON storage.objects;

-- Create storage bucket for chat files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for chat files
CREATE POLICY "Authenticated users can upload chat files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view chat files"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own chat files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own chat files"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);
