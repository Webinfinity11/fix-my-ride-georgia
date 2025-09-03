
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
  const imageUrl = image || `${baseUrl}/fixup-og-image.jpg`;
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
  const baseStructuredData = {
    "@context": "https://schema.org",
    "@type": type,
    ...data
  };

  switch (type) {
    case 'Organization':
      return {
        ...baseStructuredData,
        name: 'ავტოხელოსანი',
        url: "https://fixup.ge",
        logo: "https://fixup.ge/fixup-logo.jpg",
        description: 'საქართველოს უდიდესი ავტოსერვისების პლატფორმა',
        address: {
          "@type": "PostalAddress",
          addressCountry: "GE",
          addressLocality: "Tbilisi"
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: "+995577123456",
          email: "info@fixup.ge",
          availableLanguage: "Georgian"
        },
        sameAs: [
          "https://www.facebook.com/fixup.ge",
          "https://www.instagram.com/fixup.ge"
        ]
      };

    case 'LocalBusiness':
      return {
        ...baseStructuredData,
        "@type": "AutomotiveRepairShop",
        url: "https://fixup.ge",
        logo: "https://fixup.ge/fixup-logo.jpg",
        address: data.address ? {
          "@type": "PostalAddress",
          addressCountry: "GE",
          addressLocality: data.address.city,
          addressRegion: data.address.district,
          streetAddress: data.address.street
        } : undefined,
        geo: data.geo ? {
          "@type": "GeoCoordinates",
          latitude: data.geo.latitude,
          longitude: data.geo.longitude
        } : undefined,
        openingHours: data.openingHours || ["Mo-Fr 09:00-18:00", "Sa 09:00-16:00"],
        priceRange: data.priceRange || "$$",
        telephone: data.telephone,
        aggregateRating: data.aggregateRating ? {
          "@type": "AggregateRating",
          ratingValue: data.aggregateRating.ratingValue,
          reviewCount: data.aggregateRating.reviewCount,
          bestRating: 5,
          worstRating: 1
        } : undefined
      };

    case 'Service':
      return {
        ...baseStructuredData,
        category: data.category || "Automotive Service",
        areaServed: {
          "@type": "City",
          name: data.areaServed || "Tbilisi"
        },
        provider: data.provider ? {
          "@type": "Person",
          name: data.provider.name,
          telephone: data.provider.telephone,
          address: data.provider.address ? {
            "@type": "PostalAddress",
            addressCountry: "GE",
            addressLocality: data.provider.address.city,
            addressRegion: data.provider.address.district,
            streetAddress: data.provider.address.street
          } : undefined
        } : undefined,
        offers: data.offers ? {
          "@type": "Offer",
          price: data.offers.price || "Price on request",
          priceCurrency: "GEL",
          availability: "https://schema.org/InStock"
        } : undefined,
        aggregateRating: data.aggregateRating ? {
          "@type": "AggregateRating",
          ratingValue: data.aggregateRating.ratingValue,
          reviewCount: data.aggregateRating.reviewCount,
          bestRating: 5,
          worstRating: 1
        } : undefined
      };

    case 'Person':
      return {
        ...baseStructuredData,
        url: data.url || "https://fixup.ge",
        image: data.image || "https://fixup.ge/fixup-logo.jpg",
        jobTitle: data.jobTitle || "Automotive Mechanic",
        worksFor: {
          "@type": "Organization", 
          name: "ავტოხელოსანი",
          url: "https://fixup.ge"
        },
        address: data.address ? {
          "@type": "PostalAddress",
          addressCountry: "GE",
          addressLocality: data.address.city,
          addressRegion: data.address.district
        } : undefined,
        makesOffer: data.makesOffer ? data.makesOffer.map((offer: any) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: offer.name,
            description: offer.description
          },
          price: offer.price,
          priceCurrency: "GEL"
        })) : undefined,
        aggregateRating: data.aggregateRating ? {
          "@type": "AggregateRating",
          ratingValue: data.aggregateRating.ratingValue,
          reviewCount: data.aggregateRating.reviewCount,
          bestRating: 5,
          worstRating: 1
        } : undefined
      };

    default:
      return baseStructuredData;
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

// Add new utility functions for enhanced SEO

// Generate Product structured data for services
export const generateProductStructuredData = (service: any) => {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": service.name,
    "description": service.description || `${service.name} - ავტოსერვისი`,
    "category": "Automotive Service",
    "brand": {
      "@type": "Brand",
      "name": "ავტოხელოსანი"
    },
    "offers": {
      "@type": "Offer",
      "price": service.price_from || "შეთანხმებით",
      "priceCurrency": "GEL",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Person",
        "name": service.mechanic?.name || "ხელოსანი"
      }
    },
    "aggregateRating": service.rating ? {
      "@type": "AggregateRating",
      "ratingValue": service.rating,
      "reviewCount": service.review_count || 0,
      "bestRating": 5,
      "worstRating": 1
    } : undefined,
    "provider": {
      "@type": "Organization",
      "name": "ავტოხელოსანი",
      "url": "https://fixup.ge"
    }
  };
};

// Generate SEO-optimized titles
export const generateSEOTitle = (pageType: string, data: any, customTitle?: string) => {
  if (customTitle) return customTitle;

  switch (pageType) {
    case 'service':
      return `${data.name} - ${data.city || 'საქართველო'} | ${data.mechanic?.name || 'ხელოსანი'} | ავტოხელოსანი`;
    case 'mechanic':
      return `${data.name} - ხელოსანი ${data.city || 'საქართველო'}-ში | რეიტინგი ${data.rating}/5 | ავტოხელოსანი`;
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

// Smart text truncation for Georgian language
const smartTruncate = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  // Find the last space before maxLength to avoid cutting words
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace).trim();
  }
  
  return truncated.trim();
};

// Generate category-specific keywords
const getCategoryKeywords = (categoryName?: string): string => {
  const categoryMap: { [key: string]: string } = {
    'ავტოდიაგნოსტიკა': 'ავტოდიაგნოსტიკა, ელექტროდიაგნოსტიკა',
    'ძრავის რემონტი': 'ძრავის რემონტი, მოტორის რემონტი',
    'ფრენების რემონტი': 'ფრენების რემონტი, სამუხრუჭე სისტემა',
    'კვება': 'საწვავის სისტემა, ინჟექტორი',
    'ელექტრო': 'ელექტრო სისტემა, ავტოელექტრიკი',
    'რუბანვა': 'ავტორუბანვა, მანქანის რუბანვა'
  };
  
  return categoryMap[categoryName || ''] || '';
};

// Generate price range text
const getPriceText = (priceFrom?: number, priceTo?: number): string => {
  if (!priceFrom && !priceTo) return '';
  
  if (priceFrom && priceTo && priceFrom !== priceTo) {
    return ` ფასი: ${priceFrom}-${priceTo}₾.`;
  } else if (priceFrom) {
    return ` ფასი: ${priceFrom}₾-დან.`;
  }
  
  return '';
};

// Generate SEO-optimized descriptions
export const generateSEODescription = (pageType: string, data: any, customDescription?: string) => {
  if (customDescription) return customDescription;

  switch (pageType) {
    case 'service': {
      const serviceName = data.name || 'ავტოსერვისი';
      const city = data.city || 'საქართველო';
      const district = data.district ? `, ${data.district} რაიონი` : '';
      const mechanicName = data.mechanic?.name || data.profiles?.full_name || 'დადასტურებული ხელოსანი';
      const rating = data.rating ? ` შეფასება: ${data.rating}/5.` : '';
      const categoryKeywords = getCategoryKeywords(data.category_name);
      const priceText = getPriceText(data.price_from, data.price_to);
      const mobileService = data.on_site_service ? ' მობილური სერვისი.' : '';
      
      // Calculate available space for description
      const baseText = `${serviceName} - ${city}${district}-ში. ხელოსანი: ${mechanicName}.${rating}${priceText}${mobileService}`;
      const availableSpace = 155 - baseText.length; // Target 155 characters total
      
      let description = '';
      if (data.description && availableSpace > 20) {
        description = ' ' + smartTruncate(data.description, availableSpace - 5);
      } else if (categoryKeywords && availableSpace > 15) {
        description = ' ' + smartTruncate(categoryKeywords, availableSpace - 5);
      } else if (availableSpace > 15) {
        description = ' ხარისხიანი მომსახურება';
      }
      
      return `${baseText}${description}`;
    }
    
    case 'mechanic':
      return `${data.name} - გამოცდილი ხელოსანი ${data.city || 'საქართველო'}-ში. რეიტინგი: ${data.rating}/5 (${data.review_count} შეფასება). ${data.specialization ? `სპეციალიზაცია: ${data.specialization}. ` : ''}დაუკავშირდით ახლავე!`;
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
      return `${baseUrl}/service/${data.id}-${data.slug || createSlug(data.name)}`;
    case 'mechanic':
      return `${baseUrl}/mechanic/${data.display_id || data.id}-${data.slug || createMechanicSlug(data.display_id, data.first_name, data.last_name)}`;
    case 'category':
      return `${baseUrl}/category/${data.slug || createCategorySlug(data.name)}`;
    case 'services':
      return `${baseUrl}/services`;
    case 'home':
      return baseUrl;
    default:
      return baseUrl;
  }
};

