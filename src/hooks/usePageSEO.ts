import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  canonical?: string;
  noIndex?: boolean;
  structuredData?: object;
}

export const usePageSEO = (seoData: SEOData) => {
  const location = useLocation();

  useEffect(() => {
    // Update document title
    if (seoData.title) {
      document.title = seoData.title;
    }

    // Add/update meta description
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    if (seoData.description) {
      descMeta.setAttribute('content', seoData.description);
    }

    // Add/update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    
    const canonicalUrl = seoData.canonical || 
      `https://fixup.ge${location.pathname.replace(/\/+/g, '/').replace(/\/$/, '') || '/'}`;
    canonical.setAttribute('href', canonicalUrl);

    // Add/update robots meta
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    robots.setAttribute('content', seoData.noIndex ? 'noindex,nofollow' : 'index,follow');

    // Add structured data
    if (seoData.structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (script) {
        script.textContent = JSON.stringify(seoData.structuredData);
      } else {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.textContent = JSON.stringify(seoData.structuredData);
        document.head.appendChild(script);
      }
    }
  }, [location.pathname, seoData]);
};