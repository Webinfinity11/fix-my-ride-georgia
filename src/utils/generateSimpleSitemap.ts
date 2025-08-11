import { supabase } from '@/integrations/supabase/client';
import { createSlug } from './slugUtils';

export async function generateSimpleSitemap(): Promise<string> {
  const baseUrl = 'https://fixup.ge';
  const currentDate = new Date().toISOString().split('T')[0];
  
  try {
    // Fetch all active services
    const { data: services } = await supabase
      .from('mechanic_services')
      .select('id, name, slug, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    // Fetch all categories
    const { data: categories } = await supabase
      .from('service_categories')
      .select('id, name')
      .order('name');

    // Generate service URLs
    const serviceUrls = (services || []).map(service => {
      const lastmod = service.updated_at ? new Date(service.updated_at).toISOString().split('T')[0] : currentDate;
      const slug = service.slug || createSlug(service.name) || service.id.toString();
      return `  <url>
    <loc>${baseUrl}/service/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Generate category URLs
    const categoryUrls = (categories || []).map(category => {
      const slug = createSlug(category.name) || category.id.toString();
      return `  <url>
    <loc>${baseUrl}/category/${slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    // Create complete sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
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

  <!-- ALL ${(services || []).length} SERVICES -->
${serviceUrls.join('\n')}

  <!-- ALL ${(categories || []).length} CATEGORIES -->
${categoryUrls.join('\n')}
  
  <!-- Generated: ${currentDate} -->
</urlset>`;

    return sitemap;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw error;
  }
}

export async function updateSitemapFiles(): Promise<void> {
  try {
    const sitemapContent = await generateSimpleSitemap();
    
    // Store in localStorage for the static file fallback
    localStorage.setItem('complete-sitemap-xml', sitemapContent);
    localStorage.setItem('sitemap-last-generated', new Date().toISOString().split('T')[0]);
    
    console.log('Sitemap generated successfully');
  } catch (error) {
    console.error('Error updating sitemap files:', error);
  }
}