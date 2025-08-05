import { useEffect } from 'react';
import { generateSearchSitemap } from '@/utils/seoUtils';

const SitemapSearchXML = () => {
  useEffect(() => {
    const loadSearchSitemap = async () => {
      try {
        const xml = await generateSearchSitemap();
        
        // Set content type headers for XML
        const response = new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
          },
        });

        // Replace entire page content with XML
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // Navigate to blob URL to serve as XML
        window.location.replace(url);
        
      } catch (error) {
        console.error('Error loading search sitemap:', error);
        // Fallback XML with proper headers
        const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>https://fixup.ge/search</loc>
<changefreq>weekly</changefreq>
<priority>0.80</priority>
</url>
</urlset>`;
        
        const response = new Response(fallbackXml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
          },
        });

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.location.replace(url);
      }
    };

    loadSearchSitemap();
  }, []);

  return null;
};

export default SitemapSearchXML;