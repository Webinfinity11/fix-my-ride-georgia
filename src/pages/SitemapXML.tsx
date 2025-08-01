import { useEffect } from 'react';
import { generateSitemap } from '@/utils/seoUtils';

const SitemapXML = () => {
  useEffect(() => {
    const loadSitemap = async () => {
      try {
        const xml = await generateSitemap();
        
        // Clear everything and set as pure XML
        document.documentElement.innerHTML = '';
        document.head.innerHTML = '';
        document.body.innerHTML = '';
        
        // Create a new response to serve XML
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        
        // Redirect to the blob URL to serve pure XML
        window.location.replace(url);
        
      } catch (error) {
        console.error('Error loading sitemap:', error);
        // Fallback XML
        const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
<url>
<loc>https://fixup.ge/</loc>
<changefreq>always</changefreq>
<priority>0.80</priority>
</url>
</urlset>`;
        
        const blob = new Blob([fallbackXml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        window.location.replace(url);
      }
    };

    loadSitemap();
  }, []);

  return <div>Loading sitemap...</div>;
};

export default SitemapXML;