
import { ServiceType } from "@/hooks/useServices";
import { createSlug } from "./slugUtils";
import { supabase } from '@/integrations/supabase/client';

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

// Generate sitemap XML
export const generateSitemap = async (): Promise<string> => {
  const baseUrl = 'https://fixup.ge';
  
  // Static pages
  const staticPages = [
    { url: '', changefreq: 'daily', priority: '1.0' },
    { url: '/services', changefreq: 'daily', priority: '0.9' },
    { url: '/mechanics', changefreq: 'daily', priority: '0.9' },
    { url: '/search', changefreq: 'weekly', priority: '0.8' },
    { url: '/about', changefreq: 'monthly', priority: '0.7' },
    { url: '/contact', changefreq: 'monthly', priority: '0.7' }
  ];

  let urls = staticPages.map(page => 
    `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  );

  try {
    // Get services
    const { data: services } = await supabase
      .from('mechanic_services')
      .select('id, name, updated_at')
      .eq('is_active', true);

    if (services) {
      const serviceUrls = services.map(service => 
        `  <url>
    <loc>${baseUrl}/service/${createSlug(service.name)}</loc>
    <lastmod>${new Date(service.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
      );
      urls = urls.concat(serviceUrls);
    }

    // Get mechanics with profiles
    const { data: mechanics } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        updated_at,
        mechanic_profiles!inner(id)
      `)
      .eq('role', 'mechanic');

    if (mechanics) {
      const mechanicUrls = mechanics.map(mechanic => 
        `  <url>
    <loc>${baseUrl}/mechanic/${mechanic.id}</loc>
    <lastmod>${new Date(mechanic.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
      );
      urls = urls.concat(mechanicUrls);
    }

    // Get service categories
    const { data: categories } = await supabase
      .from('service_categories')
      .select('id, name');

    if (categories) {
      const categoryUrls = categories.map(category => 
        `  <url>
    <loc>${baseUrl}/services?category=${category.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
      );
      urls = urls.concat(categoryUrls);
    }

  } catch (error) {
    console.error('Error fetching data for sitemap:', error);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
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
