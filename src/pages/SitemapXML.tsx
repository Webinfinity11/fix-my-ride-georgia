import { useEffect } from 'react';
import { generateSitemap } from '@/utils/seoUtils';

const SitemapXML = () => {
  useEffect(() => {
    const loadSitemap = async () => {
      try {
        const xml = await generateSitemap();
        
        // Set content type and replace page with XML
        document.open();
        document.write(xml);
        document.close();
        
        // Set content type header
        if (document.head) {
          const meta = document.createElement('meta');
          meta.httpEquiv = 'Content-Type';
          meta.content = 'application/xml; charset=utf-8';
          document.head.appendChild(meta);
        }
      } catch (error) {
        console.error('Error loading sitemap:', error);
        document.open();
        document.write(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://fixup.ge/</loc>
    <changefreq>always</changefreq>
    <priority>0.80</priority>
  </url>
</urlset>`);
        document.close();
      }
    };

    loadSitemap();
  }, []);

  // Return null since we're replacing the document content
  return null;
};

export default SitemapXML;