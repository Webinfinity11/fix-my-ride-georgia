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

// Generate SEO-optimized descriptions
export const generateSEODescription = (pageType: string, data: any, customDescription?: string) => {
  if (customDescription) return customDescription;

  switch (pageType) {
    case 'service':
      return `${data.name} - ${data.city}-ში. ხელოსანი: ${data.mechanic?.name}. ${data.rating ? `შეფასება: ${data.rating}/5. ` : ''}${data.description ? data.description.substring(0, 100) : 'ხარისხიანი ავტოსერვისი'}...`;
    case 'mechanic':
      return `${data.name} - გამოცდილი ხელოსანი ${data.city}-ში. რეიტინგი: ${data.rating}/5 (${data.review_count} შეფასება). ${data.specialization ? `სპეციალიზაცია: ${data.specialization}. ` : ''}დაუკავშირდით ახლავე!`;
    case 'category':
      return `${data.name} - იპოვეთ საუკეთესო ხელოსნები ${data.name}-ის სფეროში საქართველოში. ხარისხიანი სერვისი, მიმდინარე ფასები, დადასტურებული ხელოსნები.`;
    case 'services':
      return `იპოვეთ საუკეთესო ავტოსერვისები საქართველოში. 2500+ ხელოსანი, 15000+ სერვისი, 4.8★ საშუალო რეიტინგი. ჯავშანი ახლავე!`;
    case 'home':
      return `საქართველოს უდიდესი ავტოსერვისების პლატფორმა. იპოვეთ საუკეთესო ხელოსანი თქვენს რაიონში. სწრაფი, საიმედო, ხარისხიანი მომსახურება.`;
    default:
      return `ავტოხელოსანი - საქართველოს ავტოსერვისების პლატფორმა. იპოვეთ საუკეთესო ხელოსანი თქვენი მანქანისთვის.`;
  }
};

// Generate canonical URL
export const generateCanonicalURL = (pageType: string, data: any) => {
  const baseUrl = 'https://fixup.ge';
  
  switch (pageType) {
    case 'service':
      return `${baseUrl}/service/${data.id}-${data.slug || 'service'}`;
    case 'mechanic':
      return `${baseUrl}/mechanic/${data.display_id}-${data.slug || 'mechanic'}`;
    case 'category':
      return `${baseUrl}/category/${data.slug || data.id}`;
    case 'services':
      return `${baseUrl}/services`;
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