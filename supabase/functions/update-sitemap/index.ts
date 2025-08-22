import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Georgian to Latin transliteration mapping
const georgianToLatin: { [key: string]: string } = {
  'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 't', 'ი': 'i', 'კ': 'k',
  'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u',
  'ფ': 'p', 'ქ': 'q', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'ts',
  'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
};

function createSlug(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split('')
    .map(char => georgianToLatin[char] || char)
    .join('')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Sitemap generation started...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('Supabase client created, fetching services...');

    // Get all active services
    const { data: services, error: svcError } = await supabaseClient
      .from('mechanic_services')
      .select('id, name, slug, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    console.log('Services fetched:', services?.length || 0, 'Error:', svcError);

    if (svcError) {
      console.error('Error fetching services:', svcError);
      return new Response(JSON.stringify({ error: 'Failed to fetch services' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get all categories
    const { data: categories, error: catError } = await supabaseClient
      .from('service_categories')
      .select('id, name')
      .order('name');

    console.log('Categories fetched:', categories?.length || 0, 'Error:', catError);

    if (catError) {
      console.error('Error fetching categories:', catError);
      return new Response(JSON.stringify({ error: 'Failed to fetch categories' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get all mechanics
    const { data: mechanics, error: mechError } = await supabaseClient
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
      .order('updated_at', { ascending: false });

    console.log('Mechanics fetched:', mechanics?.length || 0, 'Error:', mechError);

    if (mechError) {
      console.error('Error fetching mechanics:', mechError);
    }

    // Get popular search queries
    const { data: searchQueries, error: searchError } = await supabaseClient
      .from('search_queries')
      .select('query, search_count')
      .gte('search_count', 5)
      .order('search_count', { ascending: false })
      .limit(100);

    console.log('Search queries fetched:', searchQueries?.length || 0, 'Error:', searchError);

    if (searchError) {
      console.error('Error fetching search queries:', searchError);
    }

    if (!services || services.length === 0) {
      console.log('No services found, returning error');
      return new Response(JSON.stringify({ error: 'No services found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Starting sitemap generation...');
    const baseUrl = 'https://fixup.ge';
    const currentDate = new Date().toISOString().split('T')[0];

    // Generate service URLs with format: /service/{id}-{slug}
    const serviceUrls = services.map(service => {
      const lastmod = service.updated_at ? new Date(service.updated_at).toISOString().split('T')[0] : currentDate;
      const slug = service.slug || createSlug(service.name);
      const serviceSlug = slug ? `${service.id}-${slug}` : String(service.id);
      return `  <url>
    <loc>${baseUrl}/service/${serviceSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Generate category URLs
    const categoryUrls = (categories || []).map(cat => {
      const slug = createSlug(cat.name) || String(cat.id);
      return `  <url>
    <loc>${baseUrl}/category/${slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    // Generate mechanic URLs
    const mechanicUrls = (mechanics || []).map(mechanic => {
      const lastmod = mechanic.updated_at ? new Date(mechanic.updated_at).toISOString().split('T')[0] : currentDate;
      const mechanicProfile = Array.isArray(mechanic.mechanic_profiles) ? mechanic.mechanic_profiles[0] : mechanic.mechanic_profiles;
      const displayId = mechanicProfile?.display_id || 0;
      const mechanicSlug = `${displayId}-${createSlug(mechanic.first_name)}-${createSlug(mechanic.last_name)}`;
      return `  <url>
    <loc>${baseUrl}/mechanic/${mechanicSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    // Generate search query URLs
    const searchUrls = (searchQueries || []).map(searchQuery => {
      const querySlug = createSlug(searchQuery.query);
      return `  <url>
    <loc>${baseUrl}/search?q=${encodeURIComponent(searchQuery.query)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    // Create complete sitemap content
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
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

  <!-- AUTO-GENERATED LINKS - UPDATED ${currentDate} -->
  <!-- ALL ${services.length} ACTIVE SERVICES -->
${serviceUrls.join('\n')}

  <!-- ALL ${(categories || []).length} CATEGORIES -->
${categoryUrls.join('\n')}

  <!-- ALL ${(mechanics || []).length} MECHANICS -->
${mechanicUrls.join('\n')}

  <!-- ALL ${(searchQueries || []).length} POPULAR SEARCHES -->
${searchUrls.join('\n')}
  
  <!-- Links auto-updated: ${currentDate} -->
  
</urlset>`;

    console.log('Sitemap generation completed, total services:', services.length);

    return new Response(sitemapContent, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/xml'
      },
    })

  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})