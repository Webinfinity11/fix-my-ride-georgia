-- Create SEO metadata table
CREATE TABLE public.seo_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type TEXT NOT NULL, -- 'service', 'category', 'page'
  page_id TEXT, -- service_id, category_id, or page_name
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  h1_title TEXT,
  h2_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_type, page_id)
);

-- Enable RLS
ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies for SEO metadata
CREATE POLICY "Anyone can view SEO metadata" 
ON public.seo_metadata 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage SEO metadata" 
ON public.seo_metadata 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_seo_metadata_updated_at
BEFORE UPDATE ON public.seo_metadata
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();