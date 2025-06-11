
import { useEffect, useState } from 'react';
import { generateSitemap } from '@/utils/seoUtils';

const Sitemap = () => {
  const [sitemapXML, setSitemapXML] = useState<string>('');

  useEffect(() => {
    const loadSitemap = async () => {
      try {
        const xml = await generateSitemap();
        setSitemapXML(xml);
        
        // Set correct content type for XML
        document.addEventListener('DOMContentLoaded', () => {
          if (document.querySelector('meta[http-equiv="Content-Type"]')) {
            document.querySelector('meta[http-equiv="Content-Type"]')?.setAttribute('content', 'application/xml; charset=utf-8');
          }
        });
      } catch (error) {
        console.error('Error loading sitemap:', error);
      }
    };

    loadSitemap();
  }, []);

  // Return raw XML for sitemap
  useEffect(() => {
    if (sitemapXML) {
      document.open();
      document.write(sitemapXML);
      document.close();
    }
  }, [sitemapXML]);

  return null;
};

export default Sitemap;
