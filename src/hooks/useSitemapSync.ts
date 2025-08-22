import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sitemapManager } from '@/utils/sitemapManager';

// Hook for automatic sitemap synchronization
export const useSitemapSync = () => {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced sitemap update function
  const updateSitemapDebounced = async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(async () => {
      console.log('Auto-updating sitemap due to database changes...');
      await sitemapManager.updateSitemap();
    }, 2000); // 2 second delay
  };

  useEffect(() => {
    // Create a channel for listening to all relevant table changes
    const channel = supabase
      .channel('sitemap-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mechanic_services'
        },
        (payload) => {
          console.log('Services changed:', payload);
          updateSitemapDebounced();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_categories'
        },
        (payload) => {
          console.log('Categories changed:', payload);
          updateSitemapDebounced();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: 'role=eq.mechanic'
        },
        (payload) => {
          console.log('Mechanic profiles changed:', payload);
          updateSitemapDebounced();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'search_queries'
        },
        (payload) => {
          console.log('Search queries changed:', payload);
          updateSitemapDebounced();
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, []);

  // Manual update function
  const updateSitemap = async () => {
    return await sitemapManager.updateSitemap();
  };

  return { updateSitemap };
};