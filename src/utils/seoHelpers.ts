import { generateStructuredData } from './seoUtils';

// Generate breadcrumb structured data
export const generateBreadcrumbStructuredData = (breadcrumbs: Array<{ name: string; url: string }>) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
};

// Generate FAQ structured data
export const generateFAQStructuredData = (faqs: Array<{ question: string; answer: string }>) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};

// Generate product structured data for services
export const generateProductStructuredData = (service: any) => {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": service.name,
    "description": service.description,
    "category": "Automotive Service",
    "offers": {
      "@type": "Offer",
      "price": service.price_from || "Price on request",
      "priceCurrency": "GEL",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Person",
        "name": service.mechanic?.name
      }
    },
    "aggregateRating": service.rating ? {
      "@type": "AggregateRating",
      "ratingValue": service.rating,
      "reviewCount": service.review_count || 0,
      "bestRating": 5,
      "worstRating": 1
    } : undefined,
    "brand": {
      "@type": "Brand",
      "name": "ავტოხელოსანი"
    }
  };
};

// Generate SEO-optimized titles
export const generateSEOTitle = (pageType: string, data: any, customTitle?: string) => {
  if (customTitle) return customTitle;

  switch (pageType) {
    case 'service':
      return `${data.name} - ${data.city} | ${data.mechanic?.name} | ავტოხელოსანი`;
    case 'mechanic':
      return `${data.name} - ხელოსანი ${data.city}-ში | რეიტინგი ${data.rating}/5 | ავტოხელოსანი`;
    case 'category':
      return `${data.name} - ავტოსერვისები საქართველოში | ავტოხელოსანი`;
    case 'services':
      return `ავტოსერვისები - იპოვეთ საუკეთესო ხელოსანი | ავტოხელოსანი`;
    case 'home':
      return `ავტოხელოსანი - საქართველოს #1 ავტოსერვისების პლატფორმა`;
    default:
      return `${data.title || 'ავტოხელოსანი'} | საქართველოს ავტოსერვისების პლატფორმა`;
  }
};

// Helper function to truncate Georgian text properly (respects word boundaries)
const truncateGeorgianText = (text: string, maxLength: number = 155): string => {
  if (!text || text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  // If we find a space near the end, cut there to avoid breaking words
  if (lastSpace > maxLength - 20) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
};

// Generate SEO-optimized descriptions
export const generateSEODescription = (pageType: string, data: any, customDescription?: string) => {
  if (customDescription) return truncateGeorgianText(customDescription);

  let description = '';
  
  switch (pageType) {
    case 'service':
      description = `${data.name} - ${data.city}-ში. ხელოსანი: ${data.mechanic?.name}. ${data.rating ? `შეფასება: ${data.rating}/5. ` : ''}${data.description ? data.description.substring(0, 80) : 'ხარისხიანი ავტოსერვისი'}`;
      break;
    case 'mechanic':
      description = `${data.name} - გამოცდილი ხელოსანი ${data.city}-ში. რეიტინგი: ${data.rating}/5 (${data.review_count} შეფასება). ${data.specialization ? `სპეციალიზაცია: ${data.specialization}. ` : ''}დაუკავშირდით ახლავე!`;
      break;
    case 'category':
      description = `${data.name} - იპოვეთ საუკეთესო ხელოსნები ${data.name}-ის სფეროში საქართველოში. ხარისხიანი სერვისი, მიმდინარე ფასები, დადასტურებული ხელოსნები.`;
      break;
    case 'services':
      description = `იპოვეთ საუკეთესო ავტოსერვისები საქართველოში. 2500+ ხელოსანი, 15000+ სერვისი, 4.8★ საშუალო რეიტინგი. ჯავშანი ახლავე!`;
      break;
    case 'home':
      description = `საქართველოს უდიდესი ავტოსერვისების პლატფორმა. იპოვეთ საუკეთესო ხელოსანი თქვენს რაიონში. სწრაფი, საიმედო, ხარისხიანი მომსახურება.`;
      break;
    default:
      description = `ავტოხელოსანი - საქართველოს ავტოსერვისების პლატფორმა. იპოვეთ საუკეთესო ხელოسანი თქვენი მანქანისთვის.`;
  }
  
  return truncateGeorgianText(description);
};

// Generate canonical URL
export const generateCanonicalURL = (pageType: string, data: any) => {
  const baseUrl = 'https://fixup.ge';
  
  switch (pageType) {
    case 'service':
      // Use proper slug generation from utils
      const serviceSlug = data.slug || `${data.id}-${data.name?.toLowerCase().replace(/\s+/g, '-') || 'service'}`;
      return `${baseUrl}/service/${serviceSlug}`;
    case 'mechanic':
      const mechanicSlug = data.slug || `${data.display_id || data.id}-${data.name?.toLowerCase().replace(/\s+/g, '-') || 'mechanic'}`;
      return `${baseUrl}/mechanic/${mechanicSlug}`;
    case 'category':
      const categorySlug = data.slug || data.id;
      return `${baseUrl}/category/${categorySlug}`;
    case 'services':
      return `${baseUrl}/services`;
    case 'mechanics':
      return `${baseUrl}/mechanic`;
    case 'laundries':
      return `${baseUrl}/laundries`;
    case 'about':
      return `${baseUrl}/about`;
    case 'contact':
      return `${baseUrl}/contact`;
    case 'map':
      return `${baseUrl}/map`;
    case 'home':
      return baseUrl;
    default:
      return baseUrl;
  }
};

// Create default OG image URL
export const createOGImageURL = (title: string, description?: string) => {
  // In a real implementation, this would generate dynamic OG images
  // For now, return a default image
  return 'https://fixup.ge/fixup-og-image.jpg';
};