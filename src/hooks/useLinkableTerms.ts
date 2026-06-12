import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createSlug } from '@/utils/slugUtils';
import type { LinkableTerm } from '@/utils/autoLinkContent';

/**
 * Terms eligible for automatic in-content linking inside blog posts.
 * Cached for an hour — categories don't move that often.
 *
 * Currently sources: all service categories. Service names are intentionally
 * excluded — 530 entries would over-match and bloat the regex pass without
 * meaningful editorial value (services are long phrases rarely repeated as-is).
 */
export function useLinkableTerms() {
  return useQuery<LinkableTerm[]>({
    queryKey: ['linkable-terms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('id, name')
        .order('id');
      if (error) throw error;
      return (data || []).map((c) => ({
        term: c.name,
        href: `/category/${createSlug(c.name)}`,
      }));
    },
    staleTime: 1000 * 60 * 60,
  });
}
