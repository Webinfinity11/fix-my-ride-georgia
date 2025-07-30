import { useEffect, useState } from 'react';
import { generateSitemap } from '@/utils/seoUtils';

const SitemapXML = () => {
  const [sitemap, setSitemap] = useState<string>('');

  useEffect(() => {
    const loadSitemap = async () => {
      try {
        const xml = await generateSitemap();
        setSitemap(xml);
        
        // Set the correct content type for XML
        const response = new Response(xml, {
          headers: {
            'Content-Type': 'application/xml',
          },
        });
        
        // Replace the current page content with XML
        document.open();
        document.write(xml);
        document.close();
      } catch (error) {
        console.error('Error loading sitemap:', error);
      }
    };

    loadSitemap();
  }, []);

  // Return null since we're replacing the document content
  return null;
};

export default SitemapXML;