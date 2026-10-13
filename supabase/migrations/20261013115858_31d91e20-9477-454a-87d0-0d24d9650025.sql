ALTER FUNCTION public.get_community_feed(text, text, integer, integer) SET search_path = 'public';
ALTER FUNCTION public.get_reaction_counts(uuid) SET search_path = 'public';