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
        telephone: data.telephone
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
          telephone: data.provider.telephone
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
        address: data.address
      };

    case 'ItemList':
    case 'SearchResultsPage':
      return {
        ...baseStructuredData,
        name: data.name,
        description: data.description,
        numberOfItems: data.numberOfItems || 0,
        itemListElement: data.itemListElement || []
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
      "availability": "https://schema.org/InStock"
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
      return `${data.first_name} ${data.last_name} - ხელოსანი ${data.city}-ში | რეიტინგი ${data.rating}/5 | ავტოხელოსანი`;
    case 'category':
      return `${data.name} - ავტოსერვისები საქართველოში | ავტოხელოსანი`;
    case 'services':
      return `ავტოსერვისები - იპოვეთ საუკეთესო ხელოსანი | ავტოხელოსანი`;
    case 'mechanics':
      return `ავტომექანიკოსები - ყველა ხელოსანი საქართველოში | ავტოხელოსანი`;
    case 'search':
      return `ძიების შედეგები: ${data.query} | ავტოხელოსანი`;
    case 'about':
      return `ჩვენს შესახებ - ავტოხელოსანი | საქართველოს ავტოსერვისების პლატფორმა`;
    case 'contact':
      return `კონტაქტი - ავტოხელოსანი | დაგვიკავშირდით`;
    case 'login':
      return `შესვლა - ავტოხელოსანი | სისტემაში ავტორიზაცია`;
    case 'register':
      return `რეგისტრაცია - ავტოხელოსანი | ანგარიშის შექმნა`;
    case 'book':
      return `ჯავშნის გაკეთება - ${data.serviceName || data.mechanicName} | ავტოხელოსანი`;
    case 'map':
      return `ინტერაქტიული რუკა - იპოვეთ ხელოსანი რუკაზე | ავტოხელოსანი`;
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
      return `${data.name} - ${data.city}-ში. ხელოსანი: ${data.mechanic?.name}. ხარისხიანი ავტოსერვისი.`;
    case 'mechanic':
      return `${data.first_name} ${data.last_name} - გამოცდილი ხელოსანი ${data.city}-ში. დაუკავშირდით ახლავე!`;
    case 'category':
      return `${data.name} - იპოვეთ საუკეთესო ხელოსნები საქართველოში.`;
    case 'services':
      return `იპოვეთ საუკეთესო ავტოსერვისები საქართველოში. ჯავშანი ახლავე!`;
    case 'mechanics':
      return `ყველა გამომცდილი ავტომექანიკოსი საქართველოში. დადასტურებული პროფილები, რეიტინგები.`;
    case 'search':
      return `ძიების შედეგები "${data.query}" - იპოვეთ საუკეთესო ავტოსერვისები და ხელოსნები საქართველოში.`;
    case 'about':
      return `ავტოხელოსანი - საქართველოს უდიდესი ავტოსერვისების პლატფორმა.`;
    case 'contact': 
      return `დაგვიკავშირდით - ავტოხელოსანი. გაქვთ კითხვები?`;
    case 'login':
      return `შედით თქვენს ანგარიშში ავტოხელოსნის პლატფორმაზე.`;
    case 'register':
      return `შექმენით ანგარიში ავტوხელოსნის პლატფორმაზე.`;
    case 'book':
      return `დაჯავშეთ ${data.serviceName || 'სერვისი'} ახლავე.`;
    case 'map':
      return `იპოვეთ ავტოხელოსნები თქვენს მახლობლად რუკაზე.`;
    case 'home':
      return `საქართველოს უდიდესი ავტოსერვისების პლატფორმა.`;
    default:
      return `ავტოხელოსანი - საქართველოს ავტოსერვისების პლატფორმა.`;
  }
};

// Generate canonical URL with proper normalization
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
    case 'mechanics':
      return `${baseUrl}/mechanics`;
    case 'search':
      const searchParams = new URLSearchParams();
      if (data.query) searchParams.set('q', data.query);
      if (data.tab && data.tab !== 'services') searchParams.set('tab', data.tab);
      return `${baseUrl}/search${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    case 'about':
      return `${baseUrl}/about`;
    case 'contact':
      return `${baseUrl}/contact`;
    case 'login':
      return `${baseUrl}/login`;
    case 'register':
      return `${baseUrl}/register`;
    case 'book':
      return `${baseUrl}/book${data.serviceId ? `?service=${data.serviceId}` : data.mechanicId ? `?mechanic=${data.mechanicId}` : ''}`;
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
  return 'https://fixup.ge/fixup-og-image.jpg';
};