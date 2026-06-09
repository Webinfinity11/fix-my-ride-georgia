import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createSlug } from '../_shared/slug.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Generating focused sitemap with real URLs only...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all active services with VIP status for priority calculation
    const { data: services, error: servicesError } = await supabase
      .from('mechanic_services')
      .select('id, name, slug, updated_at, is_vip_active, vip_status, photos')
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

    // Fetch verified mechanics with rating for priority calculation
    const { data: mechanics, error: mechanicsError } = await supabase
      .from('mechanic_profiles')
      .select(`
        id,
        display_id,
        rating,
        updated_at,
        profiles!inner(role, is_verified, first_name, last_name)
      `)
      .eq('profiles.role', 'mechanic')
      .eq('profiles.is_verified', true)
      .order('display_id')

    if (mechanicsError) {
      console.error('Error fetching mechanics:', mechanicsError)
      throw mechanicsError
    }

    // Fetch published blog posts
    const { data: blogPosts, error: blogPostsError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, view_count')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (blogPostsError) {
      console.error('Error fetching blog posts:', blogPostsError)
      throw blogPostsError
    }

    // Fetch active vacancies
    const { data: vacancies, error: vacanciesError } = await supabase
      .from('mechanic_vacancies')
      .select('id, created_at, updated_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (vacanciesError) {
      console.error('Error fetching vacancies:', vacanciesError)
      // Non-fatal: continue without vacancies
    }

    // Generate sitemap XML with real, indexable URLs only
    const currentDate = new Date().toISOString().split('T')[0]
    
    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
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
  <url>
    <loc>https://fixup.ge/blog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>https://fixup.ge/vacancies</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>https://fixup.ge/leasing</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://fixup.ge/dealers</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://fixup.ge/insurance</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://fixup.ge/fuel-importers</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://fixup.ge/fuel-brands</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>
  <url>
    <loc>https://fixup.ge/community</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://fixup.ge/privacy-policy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

  <!-- Real service pages with proper slugs -->`

    // Escape XML special chars in image URLs (titles are not user-provided URLs but be safe)
    const xmlEscape = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&apos;')

    // Add real service pages with VIP priority logic + image extension
    services?.forEach((service: any) => {
      let serviceUrl

      // Check if slug already contains id-slug format (from database)
      if (service.slug && service.slug.match(/^\d+-/)) {
        serviceUrl = service.slug
      } else {
        const slug = service.slug || createSlug(service.name)
        serviceUrl = slug ? `${service.id}-${slug}` : service.id
      }

      const lastmod = service.updated_at ? new Date(service.updated_at).toISOString().split('T')[0] : currentDate

      // VIP Priority: Super VIP (0.95) > VIP (0.85) > Regular (0.75)
      const priority = service.is_vip_active && service.vip_status === 'super_vip'
        ? '0.95'
        : service.is_vip_active && service.vip_status === 'vip'
        ? '0.85'
        : '0.75'

      const changefreq = service.is_vip_active ? 'daily' : 'weekly'

      // Cap at 5 images per Google image-sitemap best practice (max 1000, but ~5 keeps file size sane)
      const photos: string[] = Array.isArray(service.photos) ? service.photos.slice(0, 5) : []
      const imageBlocks = photos
        .filter((p: string) => typeof p === 'string' && p.startsWith('http'))
        .map((photo: string) => `
    <image:image>
      <image:loc>${xmlEscape(photo)}</image:loc>
      <image:title>${xmlEscape(service.name || '')}</image:title>
    </image:image>`)
        .join('')

      sitemapXml += `
  <url>
    <loc>https://fixup.ge/service/${serviceUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageBlocks}
  </url>`
    })

    sitemapXml += `

  <!-- Real category pages -->`

    // Add category pages that match actual categories
    categories?.forEach(category => {
      const categorySlug = createSlug(category.name)
      
      // Only /category/:slug route (duplicate /services/:slug removed)
      sitemapXml += `
  <url>
    <loc>https://fixup.ge/category/${categorySlug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    })

    sitemapXml += `

  <!-- Real mechanic pages -->`

    // Add verified mechanic pages with rating-based priority
    mechanics?.forEach((mechanic: any) => {
      // Supabase can return joined `profiles` as either object or array depending on relation cardinality.
      const profile = Array.isArray(mechanic.profiles) ? mechanic.profiles[0] : mechanic.profiles
      const firstName = profile?.first_name || 'Mechanic'
      const lastName = profile?.last_name || ''
      const fullName = `${firstName} ${lastName}`.trim()
      const mechanicSlug = createSlug(fullName)
      const mechanicUrl = mechanicSlug ? `${mechanic.display_id}-${mechanicSlug}` : mechanic.display_id

      const rating = Number(mechanic.rating) || 0
      const lastmod = mechanic.updated_at
        ? new Date(mechanic.updated_at).toISOString().split('T')[0]
        : currentDate

      // High-rated mechanics (4.5+) get higher priority
      const mechanicPriority = rating >= 4.5 ? '0.85' : rating >= 4.0 ? '0.75' : '0.65'

      sitemapXml += `
  <url>
    <loc>https://fixup.ge/mechanic/${mechanicUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${mechanicPriority}</priority>
  </url>`
      // NOTE: /book/:id is intentionally excluded from sitemap — it's a transactional flow
      // (also disallowed in robots.txt) and shouldn't be indexed.
    })

    sitemapXml += `

  <!-- Real blog posts -->`

    // Add blog posts with view-based priority
    blogPosts?.forEach(post => {
      const lastmod = post.updated_at ? new Date(post.updated_at).toISOString().split('T')[0] : currentDate

      // Popular posts (1000+ views) get higher priority
      const priority = (post.view_count || 0) >= 1000 ? '0.80' : (post.view_count || 0) >= 500 ? '0.75' : '0.70'

      sitemapXml += `
  <url>
    <loc>https://fixup.ge/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`
    })

    sitemapXml += `

  <!-- Active vacancies -->`

    vacancies?.forEach((vacancy: any) => {
      const lastmod = vacancy.updated_at || vacancy.created_at
        ? new Date(vacancy.updated_at || vacancy.created_at).toISOString().split('T')[0]
        : currentDate

      sitemapXml += `
  <url>
    <loc>https://fixup.ge/vacancy/${vacancy.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.65</priority>
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

    const staticUrls = 17 // /, /services, /mechanic, /search, /about, /contact, /map, /laundries, /category, /blog, /vacancies, /leasing, /dealers, /insurance, /fuel-importers, /fuel-brands, /community, /privacy-policy
    const serviceUrls = services?.length || 0
    const categoryUrls = categories?.length || 0
    const mechanicUrls = mechanics?.length || 0
    const blogUrls = blogPosts?.length || 0
    const vacancyUrls = vacancies?.length || 0
    const totalUrls = staticUrls + serviceUrls + categoryUrls + mechanicUrls + blogUrls + vacancyUrls

    console.log(`Focused sitemap generated successfully:`)
    console.log(`- sitemap.xml with ${totalUrls} real URLs`)
    console.log(`- Only indexable content included`)
    console.log(`Breakdown: ${staticUrls} static, ${serviceUrls} services, ${categoryUrls} categories, ${mechanicUrls} mechanics, ${blogUrls} blog, ${vacancyUrls} vacancies`)

    return new Response(JSON.stringify({
      success: true,
      totalUrls,
      lastUpdate: currentDate,
      breakdown: {
        static: staticUrls,
        services: serviceUrls,
        categories: categoryUrls,
        mechanics: mechanicUrls,
        blog: blogUrls,
        vacancies: vacancyUrls,
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