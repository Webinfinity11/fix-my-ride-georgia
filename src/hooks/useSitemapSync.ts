import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sitemapManager } from '@/utils/sitemapManager';

// Hook to sync sitemap when services change
export const useSitemapSync = () => {
  // Debouncing to prevent too many updates
  const debounceRef = useRef<NodeJS.Timeout>();

  const updateSitemapDebounced = async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(async () => {
      try {
        await sitemapManager.updateLocalSitemap();
        console.log('Sitemap auto-updated successfully');
      } catch (error) {
        console.error('Error updating sitemap:', error);
      }
    }, 2000); // 2 second debounce
  };

  useEffect(() => {
    // Subscribe to changes in all relevant tables
    const channel = supabase
      .channel('sitemap-sync')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'mechanic_services'
        },
        async (payload) => {
          console.log('Service changed, updating sitemap:', payload);
          updateSitemapDebounced();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'service_categories'
        },
        async (payload) => {
          console.log('Category changed, updating sitemap:', payload);
          updateSitemapDebounced();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'profiles'
        },
        async (payload) => {
          console.log('Profile changed, checking if mechanic:', payload);
          
          // Only update sitemap for mechanic profiles
          const isRelevant = 
            payload.eventType === 'DELETE' || 
            (payload.new as any)?.role === 'mechanic' || 
            (payload.old as any)?.role === 'mechanic';
          
          if (isRelevant) {
            updateSitemapDebounced();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'search_queries'
        },
        async (payload) => {
          console.log('Search query changed, updating sitemap:', payload);
          updateSitemapDebounced();
        }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, []);


  // Manual update function
  const updateSitemap = async () => {
    await sitemapManager.updateLocalSitemap();
  };

  return { updateSitemap };
};