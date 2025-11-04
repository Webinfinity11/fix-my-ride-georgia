-- Create fuel_brands table
CREATE TABLE public.fuel_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.fuel_brands ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fuel_brands
CREATE POLICY "Anyone can view active fuel brands"
ON public.fuel_brands
FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can manage fuel brands"
ON public.fuel_brands
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Updated_at trigger for fuel_brands
CREATE TRIGGER update_fuel_brands_updated_at
BEFORE UPDATE ON public.fuel_brands
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create fuel_votes table
CREATE TABLE public.fuel_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.fuel_brands(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX idx_fuel_votes_user_id ON public.fuel_votes(user_id);
CREATE INDEX idx_fuel_votes_brand_id ON public.fuel_votes(brand_id);

-- Enable RLS
ALTER TABLE public.fuel_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fuel_votes
CREATE POLICY "Anyone can view vote statistics"
ON public.fuel_votes
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can vote"
ON public.fuel_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vote"
ON public.fuel_votes
FOR DELETE
USING (auth.uid() = user_id);

-- Function to get brand statistics
CREATE OR REPLACE FUNCTION get_fuel_brand_stats()
RETURNS TABLE (
  brand_id UUID,
  brand_name TEXT,
  logo_url TEXT,
  vote_count BIGINT,
  vote_percentage NUMERIC(5,2)
) 
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH total_votes AS (
    SELECT COUNT(*) as total FROM fuel_votes
  ),
  brand_votes AS (
    SELECT 
      fb.id,
      fb.name,
      fb.logo_url,
      fb.display_order,
      COUNT(fv.id) as votes
    FROM fuel_brands fb
    LEFT JOIN fuel_votes fv ON fb.id = fv.brand_id
    WHERE fb.is_active = true
    GROUP BY fb.id, fb.name, fb.logo_url, fb.display_order
  )
  SELECT 
    bv.id as brand_id,
    bv.name as brand_name,
    bv.logo_url,
    bv.votes as vote_count,
    CASE 
      WHEN (SELECT total FROM total_votes) > 0 
      THEN ROUND((bv.votes::numeric / (SELECT total FROM total_votes)::numeric) * 100, 2)
      ELSE 0
    END as vote_percentage
  FROM brand_votes bv
  ORDER BY bv.votes DESC, bv.display_order ASC;
$$;

-- Function to get user's vote
CREATE OR REPLACE FUNCTION get_user_vote(p_user_id UUID)
RETURNS TABLE (
  brand_id UUID,
  brand_name TEXT,
  voted_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    fb.id as brand_id,
    fb.name as brand_name,
    fv.created_at as voted_at
  FROM fuel_votes fv
  JOIN fuel_brands fb ON fv.brand_id = fb.id
  WHERE fv.user_id = p_user_id;
$$;