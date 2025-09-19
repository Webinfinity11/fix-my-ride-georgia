import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to listen for sitemap update notifications and trigger regeneration
 */
export const useSitemapAutoUpdate = () => {
  useEffect(() => {
    // Subscribe to real-time sitemap update notifications
    const subscription = supabase
      .channel('sitemap_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mechanic_services'
      }, () => {
        debouncedSitemapUpdate();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'service_categories'
      }, () => {
        debouncedSitemapUpdate();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: 'role=eq.mechanic'
      }, () => {
        debouncedSitemapUpdate();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Debounced sitemap update function
  let sitemapUpdateTimeout: NodeJS.Timeout;
  
  const debouncedSitemapUpdate = () => {
    clearTimeout(sitemapUpdateTimeout);
    sitemapUpdateTimeout = setTimeout(async () => {
      try {
        console.log('Triggering sitemap update...');
        await supabase.functions.invoke('generate-sitemap');
      } catch (error) {
        console.error('Failed to update sitemap:', error);
      }
    }, 5000); // Wait 5 seconds before updating to batch multiple changes
  };
};

/**
 * Manual sitemap update function for admin use
 */
export const updateSitemap = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-sitemap');
    
    if (error) {
      console.error('Sitemap update failed:', error);
      throw error;
    }
    
    console.log('Sitemap updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating sitemap:', error);
    throw error;
  }
};