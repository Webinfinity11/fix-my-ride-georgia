import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PopularTag {
  id: string;
  name: string;
  slug: string;
  use_count: number;
}

export function usePopularTags(limit = 15) {
  return useQuery({
    queryKey: ['popular-tags', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('id, name, slug, use_count')
        .order('use_count', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as PopularTag[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
