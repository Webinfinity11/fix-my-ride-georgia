import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePagePerformance } from '@/hooks/usePagePerformance';

export const SEOMonitor = () => {
  const location = useLocation();
  
  // Track page performance
  usePagePerformance(location.pathname);

  useEffect(() => {
    // Delay SEO checks to allow PageMeta components to render first
    const timeoutId = setTimeout(() => {
      // Add canonical URL check
      const canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        console.warn('Missing canonical URL for:', location.pathname);
      }

      // Check for meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc || !metaDesc.getAttribute('content')) {
        console.warn('Missing meta description for:', location.pathname);
      }

      // Check page title
      if (!document.title || document.title.length < 30) {
        console.warn('Page title too short or missing for:', location.pathname);
      }

      // Validate structured data
      const structuredData = document.querySelector('script[type="application/ld+json"]');
      if (structuredData) {
        try {
          JSON.parse(structuredData.textContent || '');
        } catch (e) {
          console.warn('Invalid structured data JSON for:', location.pathname);
        }
      }
    }, 200); // Longer delay to ensure PageMeta fully renders

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  return null;
};