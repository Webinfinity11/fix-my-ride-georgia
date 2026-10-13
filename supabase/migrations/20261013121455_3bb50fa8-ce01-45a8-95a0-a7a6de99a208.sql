DROP POLICY IF EXISTS "Authenticated users can upload chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload community media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload service photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload service videos" ON storage.objects;

CREATE POLICY "Users can upload chat files to own folder" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own chat files" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'chat-files' AND (owner_id = auth.uid()::text OR (storage.foldername(name))[1] = auth.uid()::text))
WITH CHECK (bucket_id = 'chat-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own chat files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-files' AND (owner_id = auth.uid()::text OR (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(auth.uid())));

CREATE POLICY "Users can upload community media to own folder" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'community-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload service photos to own folder" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'service-photos' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(auth.uid())));

CREATE POLICY "Users can upload service videos to own folder" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'service-videos' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(auth.uid())));