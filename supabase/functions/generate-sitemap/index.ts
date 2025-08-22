import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting sitemap generation...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all active services
    const { data: services, error: servicesError } = await supabase
      .from('mechanic_services')
      .select('id, name, slug, updated_at')
      .eq('is_active', true)
      .order('id')

    if (servicesError) {
      console.error('Error fetching services:', servicesError)
      throw servicesError
    }

    // Fetch all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('service_categories')
      .select('id, name')
      .order('id')

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      throw categoriesError
    }

    // Fetch all verified mechanics
    const { data: mechanics, error: mechanicsError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, updated_at')
      .eq('role', 'mechanic')
      .eq('is_verified', true)
      .order('first_name')

    if (mechanicsError) {
      console.error('Error fetching mechanics:', mechanicsError) 
      throw mechanicsError
    }

    // Generate sitemap XML
    const currentDate = new Date().toISOString().split('T')[0]
    
    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static pages -->
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
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://fixup.ge/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- Service pages -->`

    // Add all services
    services?.forEach(service => {
      const slug = service.slug || `${service.id}-${service.name.toLowerCase().replace(/\s+/g, '-')}`
      const lastmod = service.updated_at ? new Date(service.updated_at).toISOString().split('T')[0] : currentDate
      
      sitemapXml += `
  <url>
    <loc>https://fixup.ge/service/${service.id}-${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    })

    sitemapXml += `

  <!-- Category pages -->`

    // Add all categories
    categories?.forEach(category => {
      const categorySlug = category.name.toLowerCase()
        .replace(/[ა-ჰ]/g, (char: string) => {
          const georgianToLatin: { [key: string]: string } = {
            'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 't',
            'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh',
            'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'f', 'ქ': 'q', 'ღ': 'gh', 'ყ': 'q',
            'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
          }
          return georgianToLatin[char] || char
        })
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      sitemapXml += `
  <url>
    <loc>https://fixup.ge/category/${categorySlug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    })

    sitemapXml += `

  <!-- Mechanic pages -->`

    // Add all mechanics
    mechanics?.forEach(mechanic => {
      const mechanicSlug = `${mechanic.first_name}-${mechanic.last_name}`.toLowerCase()
        .replace(/[ა-ჰ]/g, (char: string) => {
          const georgianToLatin: { [key: string]: string } = {
            'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 't',
            'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh',
            'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'f', 'ქ': 'q', 'ღ': 'gh', 'ყ': 'q',
            'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
          }
          return georgianToLatin[char] || char
        })
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      const lastmod = mechanic.updated_at ? new Date(mechanic.updated_at).toISOString().split('T')[0] : currentDate

      sitemapXml += `
  <url>
    <loc>https://fixup.ge/mechanic/${mechanic.id}/${mechanicSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
    })

    sitemapXml += `
</urlset>`

    // Write sitemap to storage
    const encoder = new TextEncoder()
    const xmlData = encoder.encode(sitemapXml)
    
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

    const totalUrls = 6 + (services?.length || 0) + (categories?.length || 0) + (mechanics?.length || 0)
    
    console.log(`Sitemap generated successfully with ${totalUrls} URLs:`)
    console.log(`- 6 static pages`)
    console.log(`- ${services?.length || 0} services`)
    console.log(`- ${categories?.length || 0} categories`)
    console.log(`- ${mechanics?.length || 0} mechanics`)

    return new Response(JSON.stringify({ 
      success: true, 
      totalUrls,
      breakdown: {
        static: 6,
        services: services?.length || 0,
        categories: categories?.length || 0,
        mechanics: mechanics?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})