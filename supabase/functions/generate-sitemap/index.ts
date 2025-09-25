import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Georgian to Latin transliteration for consistent slug generation
const georgianToLatin = (text: string): string => {
  if (!text) return '';
  
  const mapping: { [key: string]: string } = {
    'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 't',
    'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh',
    'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'f', 'ქ': 'q', 'ღ': 'gh', 'ყ': 'q',
    'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
  };
  
  return text
    .toLowerCase()
    .split('')
    .map(char => mapping[char] || char)
    .join('')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Generating focused sitemap with real URLs only...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all active services with proper slug data
    const { data: services, error: servicesError } = await supabase
      .from('mechanic_services')
      .select('id, name, slug, updated_at')
      .eq('is_active', true)
      .order('id')

    if (servicesError) {
      console.error('Error fetching services:', servicesError)
      throw servicesError
    }

    // Fetch all categories for category pages
    const { data: categories, error: categoriesError } = await supabase
      .from('service_categories')
      .select('id, name')
      .order('id')

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      throw categoriesError
    }

    // Fetch verified mechanics with display_id and names for proper URL slugs
    const { data: mechanics, error: mechanicsError } = await supabase
      .from('mechanic_profiles')
      .select(`
        id, 
        display_id,
        profiles!inner(role, is_verified, first_name, last_name)
      `)
      .eq('profiles.role', 'mechanic')
      .eq('profiles.is_verified', true)
      .order('display_id')

    if (mechanicsError) {
      console.error('Error fetching mechanics:', mechanicsError) 
      throw mechanicsError
    }

    // Generate sitemap XML with real, indexable URLs only
    const currentDate = new Date().toISOString().split('T')[0]
    
    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static pages matching App.tsx routes -->
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
    <loc>https://fixup.ge/mechanic</loc>
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
    <loc>https://fixup.ge/map</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://fixup.ge/laundries</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://fixup.ge/category</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Real service pages with proper slugs -->`

    // Add real service pages - only services that exist
    services?.forEach(service => {
      const slug = service.slug || georgianToLatin(service.name)
      const serviceUrl = slug ? `${service.id}-${slug}` : service.id
      const lastmod = service.updated_at ? new Date(service.updated_at).toISOString().split('T')[0] : currentDate
      
      sitemapXml += `
  <url>
    <loc>https://fixup.ge/service/${serviceUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    })

    sitemapXml += `

  <!-- Real category pages -->`

    // Add category pages that match actual categories
    categories?.forEach(category => {
      const categorySlug = georgianToLatin(category.name)
      
      // Both routes exist: /category/:slug and /services/:slug
      sitemapXml += `
  <url>
    <loc>https://fixup.ge/category/${categorySlug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://fixup.ge/services/${categorySlug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    })

    sitemapXml += `

  <!-- Real mechanic pages -->`

    // Add verified mechanic pages using display_id-slug format
    mechanics?.forEach(mechanic => {
      // Generate mechanic slug from first_name and last_name  
      const profile = mechanic.profiles[0] // profiles is array from inner join
      const fullName = `${profile.first_name} ${profile.last_name}`.trim()
      const mechanicSlug = georgianToLatin(fullName)
      const mechanicUrl = mechanicSlug ? `${mechanic.display_id}-${mechanicSlug}` : mechanic.display_id
      
      sitemapXml += `
  <url>
    <loc>https://fixup.ge/mechanic/${mechanicUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://fixup.ge/book/${mechanicUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`
    })

    sitemapXml += `
</urlset>`

    // Generate sitemap-index.xml
    const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://fixup.ge/sitemap.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
</sitemapindex>`

    // Write both files to storage
    const encoder = new TextEncoder()
    const xmlData = encoder.encode(sitemapXml)
    const indexXmlData = encoder.encode(sitemapIndexXml)
    
    // Upload sitemap.xml
    const { error: uploadError } = await supabase.storage
      .from('service-photos')
      .upload('sitemap.xml', xmlData, {
        contentType: 'application/xml',
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading sitemap:', uploadError)
      throw uploadError
    }

    // Upload sitemap-index.xml
    const { error: indexUploadError } = await supabase.storage
      .from('service-photos')
      .upload('sitemap-index.xml', indexXmlData, {
        contentType: 'application/xml',
        upsert: true
      })

    if (indexUploadError) {
      console.error('Error uploading sitemap-index:', indexUploadError)
      throw indexUploadError
    }

    const staticUrls = 9 // Updated count for static pages
    const serviceUrls = services?.length || 0
    const categoryUrls = (categories?.length || 0) * 2 // Both /category and /services routes
    const mechanicUrls = (mechanics?.length || 0) * 2 // Both /mechanic and /book routes
    const totalUrls = staticUrls + serviceUrls + categoryUrls + mechanicUrls
    
    console.log(`Focused sitemap generated successfully:`)
    console.log(`- sitemap.xml with ${totalUrls} real URLs`)
    console.log(`- Only indexable content included`)
    console.log(`Breakdown: ${staticUrls} static, ${serviceUrls} services, ${categoryUrls} categories, ${mechanicUrls} mechanics`)

    return new Response(JSON.stringify({ 
      success: true, 
      totalUrls,
      lastUpdate: currentDate,
      breakdown: {
        static: staticUrls,
        services: serviceUrls,
        categories: categoryUrls,
        mechanics: mechanicUrls,
        totalUrls
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Error generating sitemap:', error)
    return new Response(JSON.stringify({ 
      error: error?.message || 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})