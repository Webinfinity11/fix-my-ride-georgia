import { useEffect, useState } from 'react';
import { sitemapManager } from '@/utils/sitemapManager';

const SitemapXML = () => {
  const [xmlContent, setXmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSitemap = async () => {
      try {
        console.log('Loading sitemap XML...');
        
        // Get sitemap content from the manager (cached or fresh)
        const sitemapContent = await sitemapManager.getSitemapContent();

        if (sitemapContent) {
          console.log('Sitemap loaded successfully, length:', sitemapContent.length);
          const stats = sitemapManager.extractSitemapStats(sitemapContent);
          console.log('Sitemap stats:', stats);
          setXmlContent(sitemapContent);
        } else {
          console.error('Failed to load sitemap content');
          // Fallback to basic sitemap
          setXmlContent(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://fixup.ge/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- Generated: ${new Date().toISOString()} -->
</urlset>`);
        }
      } catch (error) {
        console.error('Error loading sitemap:', error);
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