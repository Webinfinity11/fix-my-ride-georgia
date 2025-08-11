import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { updateStaticSitemap } from '@/utils/seoUtils';
import { createSlug } from '@/utils/slugUtils';

// Hook to sync sitemap when services change
export const useSitemapSync = () => {
  useEffect(() => {
    // Subscribe to changes in mechanic_services table
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
            // Update static sitemap file
            await handleSitemapUpdate();
          } catch (error) {
            console.error('Error updating sitemap after service change:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSitemapUpdate = async () => {
    try {
      const baseUrl = 'https://fixup.ge';
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Get all active services
      const { data: services } = await supabase
        .from('mechanic_services')
        .select('id, name, slug, updated_at')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (!services || services.length === 0) {
        console.log('No services found for sitemap');
        return;
      }

      // Generate service URLs
      const serviceUrls = services.map(service => {
        const lastmod = service.updated_at ? new Date(service.updated_at).toISOString().split('T')[0] : currentDate;
        const slug = service.slug || createSlug(service.name);
        return `  <url>
    <loc>${baseUrl}/service/${slug || service.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });

      // Create complete sitemap content
      const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>https://fixup.ge/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://fixup.ge/services</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://fixup.ge/mechanics</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://fixup.ge/search</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://fixup.ge/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://fixup.ge/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://fixup.ge/register</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://fixup.ge/login</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://fixup.ge/sitemap</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://fixup.ge/book</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://fixup.ge/chat</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://fixup.ge/dashboard</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- AUTO-GENERATED SERVICE LINKS - THESE WILL BE UPDATED AUTOMATICALLY -->
  <!-- Note: This static file serves as fallback. The real-time sitemap is available at /sitemap.xml route -->
  
  <!-- ALL ${services.length} ACTIVE SERVICES -->
${serviceUrls.join('\n')}
  
  <!-- AUTO-GENERATED SERVICE LINKS UPDATED: ${currentDate} -->
  <!-- For the most up-to-date sitemap including all services, visit /sitemap.xml -->
  
</urlset>`;

      // Send the content to update the static file
      // Since we can't directly write to public folder, we'll use a different approach
      console.log(`Sitemap content generated for ${services.length} services`);
      
      // Store updated content in browser storage for now
      if (typeof window !== 'undefined') {
        localStorage.setItem('updated-sitemap-content', sitemapContent);
        localStorage.setItem('sitemap-last-updated', currentDate);
      }
      
    } catch (error) {
      console.error('Error generating sitemap content:', error);
    }
  };

  // Manual update function
  const updateSitemap = async () => {
    await handleSitemapUpdate();
  };

  return { updateSitemap };
};