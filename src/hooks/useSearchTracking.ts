import { supabase } from '@/integrations/supabase/client';

export const useSearchTracking = () => {
  const trackSearch = async (query: string) => {
    const cleanQuery = query.trim();
    if (!cleanQuery || cleanQuery.length > 200) return;
    try {
      // The write-only RPC never exposes other visitors' searches.
      const { error } = await supabase.rpc('record_search_query', { p_query: cleanQuery });
      if (error) console.error('Error tracking search query:', error);
    } catch (error) {
      console.error('Error tracking search query:', error);
    }
  };
  return { trackSearch };
};
