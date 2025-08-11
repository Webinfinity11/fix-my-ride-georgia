import { useEffect } from 'react';
import { generateSimpleSitemap } from '@/utils/generateSimpleSitemap';

const SitemapXML = () => {
  useEffect(() => {
    const loadSitemap = async () => {
      try {
        const xml = await generateSimpleSitemap();
        
        // Clear all HTML content and serve pure XML
        document.documentElement.innerHTML = '';
        
        // Create new document as XML
        document.open('text/xml', 'replace');
        document.write(xml);
        document.close();
        
      } catch (error) {
        console.error('Error loading sitemap:', error);
        // Fallback XML
        const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>https://fixup.ge</loc>
<priority>1.0</priority>
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

  return null;
};

export default SitemapXML;