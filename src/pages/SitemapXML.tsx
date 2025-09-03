import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SitemapXML = () => {
  const [xmlContent, setXmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSitemap = async () => {
      try {
        // First try to load from Supabase Storage (generated sitemap)
        const { data: { publicUrl } } = supabase.storage
          .from('service-photos')
          .getPublicUrl('sitemap.xml');

        const response = await fetch(publicUrl);
        if (response.ok) {
          const content = await response.text();
          setXmlContent(content);
        } else {
          // If no generated sitemap exists, generate one
          console.log('No generated sitemap found, generating new one...');
          const { data: generateResult } = await supabase.functions.invoke('generate-sitemap', {
            body: { trigger: 'sitemap_request' }
          });
          
          if (generateResult?.success) {
            // Try to load the newly generated sitemap
            const newResponse = await fetch(publicUrl);
            if (newResponse.ok) {
              const newContent = await newResponse.text();
              setXmlContent(newContent);
            } else {
              throw new Error('Failed to load newly generated sitemap');
            }
          } else {
            throw new Error('Failed to generate sitemap');
          }
        }
      } catch (error) {
        console.error('Error loading sitemap:', error);
        // Fallback sitemap with basic structure
        setXmlContent(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://fixup.ge/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://fixup.ge/services</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://fixup.ge/mechanics</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`);
      } finally {
        setLoading(false);
      }
    };

    loadSitemap();

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
    return <div>Loading sitemap...</div>;
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