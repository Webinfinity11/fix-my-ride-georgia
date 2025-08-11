import { useEffect } from 'react';
import { sitemapManager } from '@/utils/sitemapManager';

const SitemapXML = () => {
  useEffect(() => {
    const loadSitemap = async () => {
      try {
        // First try to get existing sitemap from localStorage
        let xml = sitemapManager.getCurrentSitemap();
        
        // If no sitemap or needs update, generate new one
        if (!xml || sitemapManager.needsUpdate()) {
          console.log('Generating fresh sitemap...');
          xml = await sitemapManager.generateCompleteSitemap();
        }
        
        if (!xml) {
          throw new Error('Failed to generate sitemap');
        }
        
        // Serve the XML directly
        const response = new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600'
          }
        });
        
        // Navigate to blob URL to serve as pure XML
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.location.replace(url);
        
      } catch (error) {
        console.error('Error loading sitemap:', error);
        
        // Fallback XML with better structure
        const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
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
</urlset>`;
        
        const response = new Response(fallbackXml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
          }
        });
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.location.replace(url);
      }
    };

    loadSitemap();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading sitemap...</p>
      </div>
    </div>
  );
};

export default SitemapXML;