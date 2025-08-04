-- Create table to track search queries for sitemap generation
CREATE TABLE public.search_queries (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL UNIQUE,
  search_count INTEGER DEFAULT 1,
  first_searched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read search queries for sitemap generation
CREATE POLICY "Anyone can view search queries" 
ON public.search_queries 
FOR SELECT 
USING (true);

-- Allow anyone to insert search queries (when they search)
CREATE POLICY "Anyone can insert search queries" 
ON public.search_queries 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update search queries (to increment count)
CREATE POLICY "Anyone can update search queries" 
ON public.search_queries 
FOR UPDATE 
USING (true);

-- Create function to update updated_at timestamp
CREATE TRIGGER update_search_queries_updated_at
BEFORE UPDATE ON public.search_queries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_search_queries_query ON public.search_queries(query);
CREATE INDEX idx_search_queries_count ON public.search_queries(search_count DESC);
CREATE INDEX idx_search_queries_last_searched ON public.search_queries(last_searched_at DESC);