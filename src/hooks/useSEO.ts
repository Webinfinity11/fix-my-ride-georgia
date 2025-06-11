
import { useEffect } from 'react';
import { generateMetaTags, generateStructuredData } from '@/utils/seoUtils';

interface UseSEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  structuredDataType?: 'Organization' | 'LocalBusiness' | 'Service' | 'Person';
  structuredData?: any;
}

export const useSEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  structuredDataType,
  structuredData
}: UseSEOProps) => {
  useEffect(() => {
    const metaTags = generateMetaTags(title, description, keywords, image, url, type);
    
    // Update document title
    document.title = metaTags.title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
    
    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', title);
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', description);
    }
    
    if (image) {
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        ogImage.setAttribute('content', image);
      }
    }
    
    if (url) {
      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) {
        ogUrl.setAttribute('content', url);
      }
      
      // Update canonical URL
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', url);
    }
    
    // Add structured data if provided
    if (structuredDataType && structuredData) {
      const jsonLd = generateStructuredData(structuredDataType, structuredData);
      
      // Remove existing structured data
      const existingJsonLd = document.querySelector('script[type="application/ld+json"]');
      if (existingJsonLd) {
        existingJsonLd.remove();
      }
      
      // Add new structured data
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, keywords, image, url, type, structuredDataType, structuredData]);

  return { title, description, keywords, image, url, type };
};
