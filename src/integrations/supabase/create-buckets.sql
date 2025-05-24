
-- Create service-photos bucket for service images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-photos',
  'service-photos', 
  true,
  5242880, -- 5MB limit
  '{"image/jpeg","image/png","image/webp","image/gif"}'
);

-- Create portfolio-photos bucket for portfolio images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-photos',
  'portfolio-photos', 
  true,
  5242880, -- 5MB limit
  '{"image/jpeg","image/png","image/webp","image/gif"}'
);

-- Create policies for service-photos bucket
CREATE POLICY "Anyone can view service photos" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'service-photos');

CREATE POLICY "Authenticated users can upload service photos" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'service-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own service photos" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'service-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own service photos" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'service-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policies for portfolio-photos bucket
CREATE POLICY "Anyone can view portfolio photos" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'portfolio-photos');

CREATE POLICY "Authenticated users can upload portfolio photos" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'portfolio-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own portfolio photos" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'portfolio-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own portfolio photos" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'portfolio-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
