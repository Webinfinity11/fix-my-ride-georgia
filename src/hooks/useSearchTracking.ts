import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSearchTracking = () => {
  const trackSearch = async (query: string) => {
    if (!query || query.trim().length === 0) return;
    
    const cleanQuery = query.trim().toLowerCase();
    
    try {
      // First, try to update existing query (increment count)
      const { data: existingQuery } = await supabase
        .from('search_queries')
        .select('id, search_count')
        .eq('query', cleanQuery)
        .single();

      if (existingQuery) {
        // Update existing query with incremented count
        await supabase
          .from('search_queries')
          .update({
            search_count: existingQuery.search_count + 1,
            last_searched_at: new Date().toISOString()
          })
          .eq('id', existingQuery.id);
      } else {
        // Insert new query
        await supabase
          .from('search_queries')
          .insert({
            query: cleanQuery,
            search_count: 1,
            first_searched_at: new Date().toISOString(),
            last_searched_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error tracking search query:', error);
      // Don't throw error - search tracking shouldn't break the search functionality
    }
  };

  return { trackSearch };
};