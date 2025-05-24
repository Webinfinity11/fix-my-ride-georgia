
-- Create storage bucket for service photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service-photos', 'service-photos', true);

-- Create policy for service photos bucket to allow public access
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'service-photos');

-- Allow authenticated users to upload to service-photos bucket
CREATE POLICY "Authenticated users can upload service photos" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'service-photos' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own service photos
CREATE POLICY "Users can update their own service photos" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'service-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own service photos
CREATE POLICY "Users can delete their own service photos" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'service-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
