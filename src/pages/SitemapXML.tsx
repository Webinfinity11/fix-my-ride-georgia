import { useEffect, useState } from 'react';

const SitemapXML = () => {
  const [xmlContent, setXmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSitemap = async () => {
      try {
        // Load sitemap from public/sitemap.xml
        const response = await fetch('/sitemap.xml');
        if (response.ok) {
          const content = await response.text();
          setXmlContent(content);
        } else {
          throw new Error('Failed to load sitemap');
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