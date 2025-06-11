
import { supabase } from "@/integrations/supabase/client";

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export const generateSitemap = async (): Promise<string> => {
  const baseUrl = 'https://avtokhelosani.ge';
  const urls: SitemapUrl[] = [];

  // Static pages
  urls.push(
    { loc: `${baseUrl}/`, changefreq: 'daily', priority: 1.0 },
    { loc: `${baseUrl}/services`, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/mechanics`, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/search`, changefreq: 'weekly', priority: 0.8 },
    { loc: `${baseUrl}/about`, changefreq: 'monthly', priority: 0.7 },
    { loc: `${baseUrl}/contact`, changefreq: 'monthly', priority: 0.7 }
  );

  try {
    // Fetch service categories
    const { data: categories } = await supabase
      .from('service_categories')
      .select('id, name, updated_at')
      .order('name');

    if (categories) {
      categories.forEach(category => {
        urls.push({
          loc: `${baseUrl}/services/category/${category.id}`,
          lastmod: category.updated_at || new Date().toISOString(),
          changefreq: 'weekly',
          priority: 0.8
        });
      });
    }

    // Fetch cities
    const { data: cities } = await supabase
      .from('cities')
      .select('id, name, updated_at')
      .order('name');

    if (cities) {
      cities.forEach(city => {
        urls.push({
          loc: `${baseUrl}/services/city/${encodeURIComponent(city.name)}`,
          lastmod: city.updated_at || new Date().toISOString(),
          changefreq: 'weekly',
          priority: 0.7
        });
      });
    }

    // Fetch individual services
    const { data: services } = await supabase
      .from('mechanic_services')
      .select('id, name, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1000); // Limit for performance

    if (services) {
      services.forEach(service => {
        urls.push({
          loc: `${baseUrl}/service/${service.id}`,
          lastmod: service.updated_at || new Date().toISOString(),
          changefreq: 'weekly',
          priority: 0.6
        });
      });
    }

    // Fetch mechanic profiles
    const { data: mechanics } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .eq('role', 'mechanic')
      .order('updated_at', { ascending: false })
      .limit(500); // Limit for performance

    if (mechanics) {
      mechanics.forEach(mechanic => {
        urls.push({
          loc: `${baseUrl}/mechanic/${mechanic.id}`,
          lastmod: mechanic.updated_at || new Date().toISOString(),
          changefreq: 'weekly',
          priority: 0.6
        });
      });
    }

  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod.split('T')[0]}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return xml;
};

export const generateMetaTags = (
  title: string,
  description: string,
  keywords?: string,
  image?: string,
  url?: string,
  type: 'website' | 'article' | 'profile' = 'website'
) => {
  const baseUrl = 'https://avtokhelosani.ge';
  const defaultImage = `${baseUrl}/placeholder.svg`;
  
  return {
    title: `${title} | ავტოხელოსანი`,
    description,
    keywords: keywords || 'ავტოხელოსანი, ავტოსერვისი, მექანიკოსი, ავტომობილის რემონტი, თბილისი',
    openGraph: {
      title,
      description,
      type,
      url: url || baseUrl,
      image: image || defaultImage,
      siteName: 'ავტოხელოსანი'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image: image || defaultImage
    }
  };
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
          telephone: '+995-xxx-xxx-xxx',
          contactType: 'customer service'
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
          addressLocality: data.city,
          addressRegion: data.district,
          addressCountry: 'GE'
        },
        telephone: data.phone,
        openingHours: data.workingHours,
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
        offers: {
          '@type': 'Offer',
          price: data.priceFrom,
          priceCurrency: 'GEL'
        },
        ...data
      };

    case 'Person':
      return {
        ...baseStructure,
        name: data.name,
        jobTitle: 'ავტომექანიკოსი',
        description: data.description,
        telephone: data.phone,
        address: {
          '@type': 'PostalAddress',
          addressLocality: data.city,
          addressCountry: 'GE'
        },
        ...data
      };

    default:
      return baseStructure;
  }
};
