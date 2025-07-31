
import { ServiceType } from "@/hooks/useServices";
import { supabase } from '@/integrations/supabase/client';
import { createSlug, createCategorySlug } from './slugUtils';

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

// Generate comprehensive sitemap XML that discovers all pages automatically
export const generateSitemap = async (): Promise<string> => {
  const baseUrl = 'https://fixup.ge';
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Static pages with priorities matching the example
  const staticPages = [
    { url: '', changefreq: 'always', priority: '0.80' },
    { url: '/services', changefreq: 'always', priority: '1.00' },
    { url: '/mechanics', changefreq: 'always', priority: '1.00' },
    { url: '/search', changefreq: 'always', priority: '0.60' },
    { url: '/about', changefreq: 'always', priority: '0.70' },
    { url: '/contact', changefreq: 'always', priority: '0.50' },
    { url: '/register', changefreq: 'always', priority: '0.60' },
    { url: '/login', changefreq: 'always', priority: '0.50' },
    { url: '/sitemap', changefreq: 'always', priority: '0.60' }
  ];

  let urls = staticPages.map(page => 
    `<url>
<loc>${baseUrl}${page.url}</loc>
<changefreq>${page.changefreq}</changefreq>
<priority>${page.priority}</priority>
</url>`
  );

  try {
    // Get all active services with detailed information
    const { data: services } = await supabase
      .from('mechanic_services')
      .select(`
        id, 
        name, 
        updated_at,
        category:service_categories(id, name),
        mechanic:profiles!mechanic_services_mechanic_id_fkey(id, city, district)
      `)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (services && services.length > 0) {
      // Individual service pages
      const serviceUrls = services.map(service => 
        `<url>
<loc>${baseUrl}/service/${service.id}/${createSlug(service.name)}</loc>
<changefreq>always</changefreq>
<priority>1.00</priority>
</url>`
      );
      urls = urls.concat(serviceUrls);

      // Alternative service URL formats for compatibility
      const altServiceUrls = services.map(service => 
        `<url>
<loc>${baseUrl}/service/${createSlug(service.name)}</loc>
<changefreq>always</changefreq>
<priority>0.80</priority>
</url>`
      );
      urls = urls.concat(altServiceUrls);
    }

    // Get all mechanics with profiles
    const { data: mechanics } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        updated_at,
        city,
        district,
        mechanic_profiles!inner(id, created_at)
      `)
      .eq('role', 'mechanic')
      .order('updated_at', { ascending: false });

    if (mechanics && mechanics.length > 0) {
      // Individual mechanic profile pages
      const mechanicUrls = mechanics.map(mechanic => 
        `<url>
<loc>${baseUrl}/mechanic/${mechanic.id}</loc>
<changefreq>always</changefreq>
<priority>0.80</priority>
</url>`
      );
      urls = urls.concat(mechanicUrls);

      // Mechanic booking pages
      const bookingUrls = mechanics.map(mechanic => 
        `<url>
<loc>${baseUrl}/book?mechanic=${mechanic.id}</loc>
<changefreq>always</changefreq>
<priority>0.70</priority>
</url>`
      );
      urls = urls.concat(bookingUrls);
    }

    // Get all service categories
    const { data: categories } = await supabase
      .from('service_categories')
      .select('id, name')
      .order('name');

    if (categories && categories.length > 0) {
      // Category pages with different URL formats
      const categoryUrls = categories.map(category => 
        `<url>
<loc>${baseUrl}/services?category=${category.id}</loc>
<changefreq>always</changefreq>
<priority>0.80</priority>
</url>`
      );
      urls = urls.concat(categoryUrls);

      // Service category detail pages
      const categoryDetailUrls = categories.map(category => 
        `<url>
<loc>${baseUrl}/services/${createCategorySlug(category.name)}</loc>
<changefreq>always</changefreq>
<priority>0.80</priority>
</url>`
      );
      urls = urls.concat(categoryDetailUrls);
    }

    // Get unique cities for location-based pages
    const { data: cities } = await supabase
      .from('profiles')
      .select('city')
      .eq('role', 'mechanic')
      .not('city', 'is', null);

    if (cities && cities.length > 0) {
      const uniqueCities = [...new Set(cities.map(c => c.city).filter(Boolean))];
      
      // City-based service pages
      const cityServiceUrls = uniqueCities.map(city => 
        `<url>
<loc>${baseUrl}/services?city=${encodeURIComponent(city)}</loc>
<changefreq>always</changefreq>
<priority>0.70</priority>
</url>`
      );
      urls = urls.concat(cityServiceUrls);

      // City-based mechanic pages
      const cityMechanicUrls = uniqueCities.map(city => 
        `<url>
<loc>${baseUrl}/mechanics?city=${encodeURIComponent(city)}</loc>
<changefreq>always</changefreq>
<priority>0.70</priority>
</url>`
      );
      urls = urls.concat(cityMechanicUrls);
    }

    // Get unique service categories for specialized pages
    const { data: serviceCategories } = await supabase
      .from('service_categories')
      .select('id, name');

    if (serviceCategories && serviceCategories.length > 0) {
      const specializedServiceUrls = serviceCategories.map(category => 
        `<url>
<loc>${baseUrl}/mechanics?service=${encodeURIComponent(category.name)}</loc>
<changefreq>always</changefreq>
<priority>0.60</priority>
</url>`
      );
      urls = urls.concat(specializedServiceUrls);
    }

    // Add search combinations for popular queries
    const popularSearches = [
      'ავტო+რემონტი',
      'მექანიკოსი',
      'საბურავი+შეცვლა',
      'ძრავის+რემონტი',
      'ელექტრო+სისტემა',
      'კონდიციონერი',
      'ბრეიკები',
      'ტრანსმისია'
    ];

    const searchUrls = popularSearches.map(search => 
      `<url>
<loc>${baseUrl}/search?q=${encodeURIComponent(search)}</loc>
<changefreq>always</changefreq>
<priority>0.50</priority>
</url>`
    );
    urls = urls.concat(searchUrls);

  } catch (error) {
    console.error('Error fetching data for comprehensive sitemap:', error);
  }

  // Ensure we don't exceed 50,000 URLs (Google limit)
  if (urls.length > 50000) {
    console.warn(`Sitemap has ${urls.length} URLs, truncating to 50,000`);
    urls = urls.slice(0, 50000);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.join('\n')}
</urlset>`;
};

// Generate sitemap index for multiple sitemaps if needed
export const generateSitemapIndex = async (): Promise<string> => {
  const baseUrl = 'https://fixup.ge';
  const currentDate = new Date().toISOString().split('T')[0];
  
  // For now, we'll use a single sitemap, but this can be expanded
  // if we need to split into multiple sitemaps
  const sitemaps = [
    {
      loc: `${baseUrl}/sitemap.xml`,
      lastmod: currentDate
    }
  ];

  const sitemapEntries = sitemaps.map(sitemap =>
    `  <sitemap>
    <loc>${sitemap.loc}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.join('\n')}
</sitemapindex>`;
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
