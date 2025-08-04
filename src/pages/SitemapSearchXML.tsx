import { useEffect } from 'react';
import { generateSearchSitemap } from '@/utils/seoUtils';

const SitemapSearchXML = () => {
  useEffect(() => {
    const loadSearchSitemap = async () => {
      try {
        const xml = await generateSearchSitemap();
        
        // Clear all HTML content and serve pure XML
        document.documentElement.innerHTML = '';
        
        // Create new document as XML
        document.open('text/xml', 'replace');
        document.write(xml);
        document.close();
        
      } catch (error) {
        console.error('Error loading search sitemap:', error);
        // Fallback XML
        const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>https://fixup.ge/search</loc>
<changefreq>weekly</changefreq>
<priority>0.80</priority>
</url>
</urlset>`;
        
        document.documentElement.innerHTML = '';
        document.open('text/xml', 'replace');
        document.write(fallbackXml);
        document.close();
      }
    };

    loadSearchSitemap();
  }, []);

  return null; // No need to render anything since we're replacing the document
};

export default SitemapSearchXML;