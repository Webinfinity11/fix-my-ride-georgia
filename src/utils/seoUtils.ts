
import { supabase } from '@/integrations/supabase/client';

export const generateMetaTags = (
  title: string,
  description: string,
  keywords?: string,
  image?: string,
  url?: string,
  type: 'website' | 'article' | 'profile' = 'website'
) => {
  const baseUrl = 'https://avtokhelosani.ge';
  const fullTitle = `${title} | ავტოხელოსანი`;
  const imageUrl = image || `${baseUrl}/placeholder.svg`;
  const pageUrl = url || baseUrl;

  return {
    title: fullTitle,
    description,
    keywords,
    image: imageUrl,
    url: pageUrl,
    type
  };
};

export const generateSitemap = async (): Promise<string> => {
  const baseUrl = 'https://avtokhelosani.ge';
  
  // Static pages
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/services', priority: '0.9', changefreq: 'daily' },
    { url: '/mechanics', priority: '0.9', changefreq: 'daily' },
    { url: '/search', priority: '0.8', changefreq: 'weekly' },
    { url: '/about', priority: '0.7', changefreq: 'monthly' },
    { url: '/contact', priority: '0.7', changefreq: 'monthly' }
  ];

  // Fetch dynamic data
  const { data: categories } = await supabase
    .from('service_categories')
    .select('id, name');

  const { data: services } = await supabase
    .from('mechanic_services')
    .select('id, name, updated_at')
    .eq('is_active', true);

  const { data: mechanics } = await supabase
    .from('mechanic_profiles')
    .select('id')
    .join('profiles', 'mechanic_profiles.id', 'profiles.id')
    .select('profiles.updated_at');

  const { data: cities } = await supabase
    .from('cities')
    .select('id, name, updated_at');

  let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add static pages
  staticPages.forEach(page => {
    xmlContent += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  });

  // Add service categories
  if (categories) {
    categories.forEach(category => {
      xmlContent += `
  <url>
    <loc>${baseUrl}/services?category=${category.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });
  }

  // Add individual services
  if (services) {
    services.forEach(service => {
      const lastmod = service.updated_at ? new Date(service.updated_at).toISOString().split('T')[0] : undefined;
      xmlContent += `
  <url>
    <loc>${baseUrl}/service/${service.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ''}
  </url>`;
    });
  }

  // Add mechanic profiles
  if (mechanics) {
    mechanics.forEach(mechanic => {
      xmlContent += `
  <url>
    <loc>${baseUrl}/mechanic/${mechanic.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });
  }

  // Add cities
  if (cities) {
    cities.forEach(city => {
      xmlContent += `
  <url>
    <loc>${baseUrl}/search?city=${encodeURIComponent(city.name)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });
  }

  xmlContent += `
</urlset>`;

  return xmlContent;
};

export const generateStructuredData = (
  type: 'Organization' | 'LocalBusiness' | 'Service' | 'Person',
  data: any
) => {
  const baseStructure = {
    '@context': 'https://schema.org',
    '@type': type
  };

  switch (type) {
    case 'Organization':
      return {
        ...baseStructure,
        name: 'ავტოხელოსანი',
        url: 'https://avtokhelosani.ge',
        logo: 'https://avtokhelosani.ge/placeholder.svg',
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
        name: data.name,
        description: data.description,
        address: {
          '@type': 'PostalAddress',
          streetAddress: data.address,
          addressLocality: data.city,
          addressCountry: 'GE'
        },
        telephone: data.phone,
        priceRange: data.priceRange,
        ...data
      };

    case 'Service':
      return {
        ...baseStructure,
        name: data.name,
        description: data.description,
        provider: {
          '@type': 'Person',
          name: data.providerName
        },
        areaServed: data.city,
        ...data
      };

    case 'Person':
      return {
        ...baseStructure,
        name: data.name,
        jobTitle: data.jobTitle || 'ავტომექანიკოსი',
        worksFor: {
          '@type': 'Organization',
          name: 'ავტოხელოსანი'
        },
        ...data
      };

    default:
      return baseStructure;
  }
};

export const getPageKeywords = (page: string, additionalKeywords: string[] = []): string => {
  const baseKeywords = [
    'ავტოხელოსანი',
    'ავტოსერვისი',
    'მექანიკოსი',
    'ავტომობილის რემონტი',
    'თბილისი',
    'საქართველო',
    'ავტოდახმარება'
  ];

  const pageSpecificKeywords: Record<string, string[]> = {
    '/': ['ავტოხელოსნის ძებნა', 'ავტოსერვისი ონლაინ', 'მექანიკოსის შერჩევა'],
    '/services': ['ავტოსერვისები', 'ავტომობილის მომსახურება', 'ავტორემონტი'],
    '/mechanics': ['ავტომექანიკოსები', 'გამოცდილი ხელოსნები', 'ავტოსპეციალისტები'],
    '/search': ['ძებნა', 'ფილტრაცია', 'მიკროლოკაცია'],
    '/about': ['ჩვენს შესახებ', 'კომპანია', 'მისია'],
    '/contact': ['კონტაქტი', 'დაკავშირება', 'მხარდაჭერა']
  };

  const keywords = [
    ...baseKeywords,
    ...(pageSpecificKeywords[page] || []),
    ...additionalKeywords
  ];

  return keywords.join(', ');
};
