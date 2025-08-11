import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sitemapManager } from '@/utils/sitemapManager';

// Hook to sync sitemap when services change
export const useSitemapSync = () => {
  useEffect(() => {
    // Subscribe to changes in mechanic_services and service_categories tables
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
          
          try {
            await sitemapManager.updateLocalSitemap();
            console.log('Sitemap auto-updated after service change');
          } catch (error) {
            console.error('Error updating sitemap after service change:', error);
          }
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
          
          try {
            await sitemapManager.updateLocalSitemap();
            console.log('Sitemap auto-updated after category change');
          } catch (error) {
            console.error('Error updating sitemap after category change:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  // Manual update function
  const updateSitemap = async () => {
    await sitemapManager.updateLocalSitemap();
  };

  return { updateSitemap };
};