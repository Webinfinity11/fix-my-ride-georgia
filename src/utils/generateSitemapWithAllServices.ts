import { supabase } from '@/integrations/supabase/client';
import { createSlug } from './slugUtils';

export async function generateSitemapWithAllServices(): Promise<string | null> {
  try {
    const baseUrl = 'https://fixup.ge';
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Get ALL active services
    const { data: services, error } = await supabase
      .from('mechanic_services')
      .select('id, name, slug, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching services:', error);
      return null;
    }

    if (!services || services.length === 0) {
      console.log('No services found for sitemap');
      return null;
    }

    console.log(`Generating sitemap for ALL ${services.length} services`);

    // Generate all service URLs
    const serviceUrls = services.map(service => {
      const lastmod = service.updated_at ? new Date(service.updated_at).toISOString().split('T')[0] : currentDate;
      const slug = service.slug || createSlug(service.name) || service.id.toString();
      return `  <url>
    <loc>${baseUrl}/service/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Create complete sitemap with ALL services
    const fullSitemap = `<?xml version="1.0" encoding="UTF-8"?>
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

  <!-- ALL ${services.length} ACTIVE SERVICES -->
${serviceUrls.join('\n')}
  
  <!-- Generated: ${currentDate} with ${services.length} services -->
</urlset>`;

    return fullSitemap;
    
  } catch (error) {
    console.error('Error generating complete sitemap:', error);
    return null;
  }
}

export async function updateSitemapFile(): Promise<boolean> {
  try {
    const sitemapContent = await generateSitemapWithAllServices();
    
    if (sitemapContent) {
      // Store the complete sitemap for deployment
      localStorage.setItem('complete-sitemap-xml', sitemapContent);
      localStorage.setItem('sitemap-last-generated', new Date().toISOString().split('T')[0]);
      
      console.log('Complete sitemap generated and stored');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating sitemap file:', error);
    return false;
  }
}