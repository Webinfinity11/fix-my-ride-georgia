import { useEffect } from 'react';
import { generateSitemap } from '@/utils/seoUtils';

const SitemapXML = () => {
  useEffect(() => {
    const loadSitemap = async () => {
      try {
        const xml = await generateSitemap();
        
        // Clear all HTML content and serve pure XML
        document.documentElement.innerHTML = '';
        
        // Create new document as XML
        document.open('text/xml', 'replace');
        document.write(xml);
        document.close();
        
      } catch (error) {
        console.error('Error loading sitemap:', error);
        // Fallback XML with exact formatting
        const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
<url>
<loc>https://fixup.ge</loc>
<changefreq>always</changefreq>
<priority>0.80</priority>
</url>
</urlset>`;
        
        document.documentElement.innerHTML = '';
        document.open('text/xml', 'replace');
        document.write(fallbackXml);
        document.close();
      }
    };

    loadSitemap();
  }, []);

  return null; // No need to render anything since we're replacing the document
};

export default SitemapXML;