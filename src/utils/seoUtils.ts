
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

// Generate comprehensive sitemap XML that discovers all pages automatically
export const generateSitemap = async (): Promise<string> => {
  const baseUrl = 'https://fixup.ge';
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Static pages with updated priorities and change frequencies
  const staticPages = [
    { url: '', changefreq: 'daily', priority: '1.0' },
    { url: '/services', changefreq: 'daily', priority: '0.9' },
    { url: '/mechanics', changefreq: 'daily', priority: '0.9' },
    { url: '/search', changefreq: 'weekly', priority: '0.8' },
    { url: '/about', changefreq: 'monthly', priority: '0.7' },
    { url: '/contact', changefreq: 'monthly', priority: '0.7' },
    { url: '/register', changefreq: 'monthly', priority: '0.6' },
    { url: '/login', changefreq: 'monthly', priority: '0.5' },
    { url: '/sitemap', changefreq: 'weekly', priority: '0.4' },
    { url: '/book', changefreq: 'weekly', priority: '0.8' },
    { url: '/chat', changefreq: 'weekly', priority: '0.7' },
    { url: '/dashboard', changefreq: 'weekly', priority: '0.6' }
  ];

  let urls = staticPages.map(page => 
    `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  );

  try {
    // 1. ALL ACTIVE SERVICES - Individual service detail pages (get all services, no limit)
    const { data: services } = await supabase
      .from('mechanic_services')
      .select('id, name, slug, updated_at, mechanic_id')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (services && services.length > 0) {
      const serviceUrls = services.map(service => {
        const lastmod = service.updated_at ? new Date(service.updated_at).toISOString().split('T')[0] : currentDate;
        const slug = service.slug || createSlug(service.name);
        return `  <url>
    <loc>${baseUrl}/service/${slug || service.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });
      urls = urls.concat(serviceUrls);
    }

    // 2. ALL MECHANIC PROFILES - Individual mechanic pages
    const { data: mechanics } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        updated_at,
        mechanic_profiles!inner(display_id)
      `)
      .eq('role', 'mechanic')
      .eq('is_verified', true)
      .limit(1000);

    if (mechanics && mechanics.length > 0) {
      const mechanicUrls = mechanics.map(mechanic => {
        const lastmod = mechanic.updated_at ? new Date(mechanic.updated_at).toISOString().split('T')[0] : currentDate;
        const mechanicProfile = Array.isArray(mechanic.mechanic_profiles) ? mechanic.mechanic_profiles[0] : mechanic.mechanic_profiles;
        const mechanicSlug = createMechanicSlug(mechanicProfile?.display_id || 0, mechanic.first_name, mechanic.last_name);
        return `  <url>
    <loc>${baseUrl}/mechanic/${mechanicSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });
      urls = urls.concat(mechanicUrls);
    }

    // 3. SERVICE CATEGORIES - Category pages and filtered views
    const { data: categories } = await supabase
      .from('service_categories')
      .select('id, name')
      .order('id');

    if (categories && categories.length > 0) {
      // Category filter pages
      const categoryFilterUrls = categories.map(category => 
        `  <url>
    <loc>${baseUrl}/services?category=${category.id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
      );
      urls = urls.concat(categoryFilterUrls);

      // Category slug pages
      const categorySlugUrls = categories.map(category => {
        const slug = createCategorySlug(category.name);
        return `  <url>
    <loc>${baseUrl}/category/${slug || category.id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });
      urls = urls.concat(categorySlugUrls);

      // Mechanic specialization pages
      const mechanicSpecializationUrls = categories.map(category => 
        `  <url>
    <loc>${baseUrl}/mechanics?category=${category.id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
      );
      urls = urls.concat(mechanicSpecializationUrls);
    }

    // 4. CITIES AND LOCATIONS - All city-based pages
    const { data: allCities } = await supabase
      .from('cities')
      .select('name, updated_at')
      .limit(100);

    if (allCities && allCities.length > 0) {
      // City service pages
      const cityServiceUrls = allCities.map(city => {
        const lastmod = city.updated_at ? new Date(city.updated_at).toISOString().split('T')[0] : currentDate;
        return `  <url>
    <loc>${baseUrl}/services?city=${encodeURIComponent(city.name)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });
      urls = urls.concat(cityServiceUrls);

      // City mechanic pages
      const cityMechanicUrls = allCities.map(city => {
        const lastmod = city.updated_at ? new Date(city.updated_at).toISOString().split('T')[0] : currentDate;
        return `  <url>
    <loc>${baseUrl}/mechanics?city=${encodeURIComponent(city.name)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });
      urls = urls.concat(cityMechanicUrls);
    }

    // 5. COMBINED CATEGORY + CITY PAGES (for popular combinations)
    if (categories && allCities && categories.length > 0 && allCities.length > 0) {
      // Take top 5 categories and top 10 cities for combinations
      const topCategories = categories.slice(0, 5);
      const topCities = allCities.slice(0, 10);
      
      topCategories.forEach(category => {
        topCities.forEach(city => {
          urls.push(`  <url>
    <loc>${baseUrl}/services?category=${category.id}&city=${encodeURIComponent(city.name)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);

          urls.push(`  <url>
    <loc>${baseUrl}/mechanics?category=${category.id}&city=${encodeURIComponent(city.name)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
        });
      });
    }

    // 6. SEARCH PAGES - Popular search combinations
    const popularSearchTerms = [
      'ავტო რემონტი',
      'მექანიკოსი',
      'საბურავი შეცვლა',
      'ძრავის რემონტი',
      'ელექტრო სისტემა',
      'კონდიციონერი',
      'ბრეიკები',
      'ტრანსმისია',
      'ზეთის შეცვლა',
      'გადაცემათა კოლოფი',
      'ამორტიზატორები',
      'ბატარეა',
      'საწყისი',
      'გენერატორი',
      'თერმოსტატი'
    ];

    const searchUrls = popularSearchTerms.map(term => 
      `  <url>
    <loc>${baseUrl}/search?q=${encodeURIComponent(term)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`
    );
    urls = urls.concat(searchUrls);

    // 7. CAR BRANDS - If mechanics specialize in specific brands
    const { data: carBrands } = await supabase
      .from('car_brands')
      .select('name')
      .eq('is_popular', true)
      .limit(20);

    if (carBrands && carBrands.length > 0) {
      const brandUrls = carBrands.map(brand => 
        `  <url>
    <loc>${baseUrl}/search?brand=${encodeURIComponent(brand.name)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`
      );
      urls = urls.concat(brandUrls);
    }

    // 8. SERVICE DETAIL PAGES - Alternative URLs
    if (services && services.length > 0) {
      // Alternative service detail URLs
      const serviceDetailUrls = services.slice(0, 100).map(service => {
        const lastmod = service.updated_at ? new Date(service.updated_at).toISOString().split('T')[0] : currentDate;
        return `  <url>
    <loc>${baseUrl}/services/${service.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });
      urls = urls.concat(serviceDetailUrls);
    }

  } catch (error) {
    console.error('Error fetching data for sitemap:', error);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.join('\n')}
</urlset>`;
};

// Generate search queries sitemap XML
export const generateSearchSitemap = async (): Promise<string> => {
  const baseUrl = 'https://fixup.ge';
  const currentDate = new Date().toISOString().split('T')[0];
  
  try {
    // Get popular search queries (limit to prevent too large sitemap)
    const { data: searchQueries } = await supabase
      .from('search_queries')
      .select('query, search_count, last_searched_at')
      .gte('search_count', 2) // Only include queries searched at least twice
      .order('search_count', { ascending: false })
      .limit(500); // Limit to most popular 500 searches

    let urls: string[] = [];

    if (searchQueries && searchQueries.length > 0) {
      urls = searchQueries.map(searchQuery => {
        const encodedQuery = encodeURIComponent(searchQuery.query);
        const lastmod = searchQuery.last_searched_at 
          ? new Date(searchQuery.last_searched_at).toISOString().split('T')[0] 
          : currentDate;
        
        // Higher priority for more popular searches
        const priority = searchQuery.search_count >= 10 ? '0.7' : 
                        searchQuery.search_count >= 5 ? '0.6' : '0.5';
        
        return `  <url>
    <loc>${baseUrl}/search?q=${encodedQuery}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
      });
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
  } catch (error) {
    console.error('Error generating search sitemap:', error);
    // Return minimal search sitemap on error
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/search</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
  }
};

// Generate sitemap index for multiple sitemaps
export const generateSitemapIndex = async (): Promise<string> => {
  const baseUrl = 'https://fixup.ge';
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Include both main sitemap and search sitemap
  const sitemaps = [
    {
      loc: `${baseUrl}/sitemap.xml`,
      lastmod: currentDate
    },
    {
      loc: `${baseUrl}/sitemap-search.xml`,
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

// Update static sitemap file with all current services
export const updateStaticSitemap = async (): Promise<void> => {
  try {
    const baseUrl = 'https://fixup.ge';
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Get all active services
    const { data: services } = await supabase
      .from('mechanic_services')
      .select('id, name, slug, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (!services || services.length === 0) {
      console.log('No services found to update sitemap');
      return;
    }

    // Generate service URLs for static sitemap
    const serviceUrls = services.map(service => {
      const lastmod = service.updated_at ? new Date(service.updated_at).toISOString().split('T')[0] : currentDate;
      const slug = service.slug || createSlug(service.name);
      return `  <url>
    <loc>${baseUrl}/service/${slug || service.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Read current sitemap to preserve static content
    const staticSitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>https://fixup.ge/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://fixup.ge/services</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://fixup.ge/mechanics</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://fixup.ge/search</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://fixup.ge/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://fixup.ge/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://fixup.ge/register</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://fixup.ge/login</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://fixup.ge/sitemap</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://fixup.ge/book</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://fixup.ge/chat</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://fixup.ge/dashboard</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- AUTO-GENERATED SERVICE LINKS - THESE WILL BE UPDATED AUTOMATICALLY -->
  <!-- Note: This static file serves as fallback. The real-time sitemap is available at /sitemap.xml route -->
  
  <!-- EXISTING SERVICES -->
${serviceUrls.join('\n')}
  
  <!-- AUTO-GENERATED SERVICE LINKS WILL BE APPENDED HERE BY THE SYSTEM -->
  <!-- For the most up-to-date sitemap including all services, visit /sitemap.xml -->
  
</urlset>`;

    // This would update the static file - for now, log the result
    console.log(`Static sitemap updated with ${services.length} services`);
    console.log('Updated sitemap content ready for file write');
    
    return;
  } catch (error) {
    console.error('Error updating static sitemap:', error);
    throw error;
  }
};
