
import { ServiceType } from "@/hooks/useServices";
import { supabase } from '@/integrations/supabase/client';
import { createSlug, createCategorySlug, createMechanicSlug } from './slugUtils';

// Generate meta tags for SEO
export const generateMetaTags = (
  title: string,
  description: string,
  keywords?: string,
  image?: string,
  url?: string,
  type?: 'website' | 'article' | 'profile'
) => {
  const baseUrl = 'https://fixup.ge';
  const fullTitle = `${title} | ავტოხელოსანი`;
  const imageUrl = image || `${baseUrl}/placeholder.svg`;
  const pageUrl = url || baseUrl;

  return {
    title: fullTitle,
    description,
    keywords,
    image: imageUrl,
    url: pageUrl,
    type: type || 'website'
  };
};

// Generate structured data for different types
export const generateStructuredData = (type: string, data: any) => {
  const baseStructure = {
    '@context': 'https://schema.org',
    '@type': type
  };

  switch (type) {
    case 'Organization':
      return {
        ...baseStructure,
        name: 'ავტოხელოსანი',
        url: 'https://fixup.ge',
        logo: 'https://fixup.ge/placeholder.svg',
        description: 'პლატფორმა, რომელიც აკავშირებს ავტომობილის ხელოსნებს და მომხმარებლებს',
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          availableLanguage: 'Georgian'
        },
        ...data
      };
    
    case 'LocalBusiness':
      return {
        ...baseStructure,
        name: data.name || 'ავტოხელოსანი',
        address: data.address,
        telephone: data.phone,
        openingHours: data.hours,
        ...data
      };
    
    case 'Service':
      return {
        ...baseStructure,
        name: data.name,
        description: data.description,
        provider: {
          '@type': 'Organization',
          name: 'ავტოხელოსანი'
        },
        ...data
      };
    
    case 'Person':
      return {
        ...baseStructure,
        name: data.name,
        jobTitle: data.jobTitle || 'მექანიკოსი',
        worksFor: {
          '@type': 'Organization',
          name: 'ავტოხელოსანი'
        },
        ...data
      };
    
    default:
      return { ...baseStructure, ...data };
  }
};

// Generate breadcrumb structured data
export const generateBreadcrumbStructuredData = (breadcrumbs: Array<{name: string, url: string}>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
};

// Generate FAQ structured data
export const generateFAQStructuredData = (faqs: Array<{question: string, answer: string}>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
};

// Generate review/rating structured data
export const generateReviewStructuredData = (reviews: any[]) => {
  if (!reviews || reviews.length === 0) return null;
  
  const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    ratingValue: averageRating.toFixed(1),
    reviewCount: reviews.length,
    bestRating: 5,
    worstRating: 1
  };
};

