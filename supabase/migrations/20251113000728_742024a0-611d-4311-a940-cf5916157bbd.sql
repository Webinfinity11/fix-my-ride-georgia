-- Create reactions table
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'funny', 'fire', 'helpful')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Enable RLS
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reactions
CREATE POLICY "Anyone can view reactions"
  ON public.reactions
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add reactions"
  ON public.reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
  ON public.reactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_reactions_post_id ON public.reactions(post_id);
CREATE INDEX idx_reactions_user_id ON public.reactions(user_id);

-- Add function to get reaction counts
CREATE OR REPLACE FUNCTION public.get_reaction_counts(p_post_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_object_agg(reaction_type, count)
  INTO result
  FROM (
    SELECT reaction_type, COUNT(*)::int as count
    FROM public.reactions
    WHERE post_id = p_post_id
    GROUP BY reaction_type
  ) counts;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;