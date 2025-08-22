import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SitemapXML = () => {
  const [xmlContent, setXmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateSitemap = async () => {
      try {
        console.log('Generating sitemap XML...');
        
        // Call the update-sitemap edge function to get XML content
        const { data, error } = await supabase.functions.invoke('update-sitemap', {
          body: {}
        });

        console.log('Sitemap response:', { data, error });

        if (error) {
          console.error('Error generating sitemap:', error);
          // Fallback to basic sitemap
          setXmlContent(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://fixup.ge/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- Error: ${error.message} -->
</urlset>`);
        } else if (typeof data === 'string') {
          console.log('Sitemap generated successfully, length:', data.length);
          setXmlContent(data);
        } else {
          console.error('Invalid sitemap data received:', typeof data, data);
          // Still show the data if it exists
          setXmlContent(String(data) || `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://fixup.ge/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
        }
      } catch (error) {
        console.error('Error calling sitemap function:', error);
        setXmlContent(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://fixup.ge/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- Error: ${String(error)} -->
</urlset>`);
      } finally {
        setLoading(false);
      }
    };

    generateSitemap();

    // Set proper XML content type
    const metaTag = document.querySelector('meta[http-equiv="Content-Type"]');
    if (!metaTag) {
      const newMeta = document.createElement('meta');
      newMeta.setAttribute('http-equiv', 'Content-Type');
      newMeta.setAttribute('content', 'application/xml; charset=UTF-8');
      document.head.appendChild(newMeta);
    }
  }, []);

  if (loading) {
    return <div>Generating sitemap...</div>;
  }

  // Return raw XML content
  return (
    <pre 
      style={{ 
        margin: 0, 
        padding: 0, 
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}
      dangerouslySetInnerHTML={{ __html: xmlContent }}
    />
  );
};

export default SitemapXML;