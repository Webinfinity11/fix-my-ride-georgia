import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createSlug } from '../_shared/slug.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE = 'https://fixup.ge'

const xmlEscape = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Generating split sitemap (RankMath-style index + 4 child sitemaps)...')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const today = new Date().toISOString().split('T')[0]

    const [
      { data: services, error: servicesError },
      { data: categories, error: categoriesError },
      { data: mechanics, error: mechanicsError },
      { data: blogPosts, error: blogPostsError },
      { data: vacancies, error: vacanciesError },
    ] = await Promise.all([
      supabase.from('mechanic_services')
        .select('id, name, slug, updated_at, is_vip_active, vip_status, photos')
        .eq('is_active', true)
        .order('id'),
      supabase.from('service_categories')
        .select('id, name')
        .order('id'),
      // ALL mechanics (verified + unverified)
      supabase.from('mechanic_profiles')
        .select('id, display_id, rating, updated_at, profiles!inner(role, is_verified, first_name, last_name)')
        .eq('profiles.role', 'mechanic')
        .order('display_id'),
      supabase.from('blog_posts')
        .select('slug, updated_at, view_count, featured_image, title')
        .eq('status', 'published')
        .order('published_at', { ascending: false }),
      supabase.from('mechanic_vacancies')
        .select('id, created_at, updated_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    ])

    for (const [name, err] of Object.entries({ servicesError, categoriesError, mechanicsError, blogPostsError, vacanciesError })) {
      if (err) console.error(`[sitemap] ${name}:`, (err as any).message)
    }

    // ============ sitemap-static.xml ============
    const STATIC_PAGES: Array<{ path: string; priority: string; changefreq: string }> = [
      { path: '/',                priority: '1.0',  changefreq: 'daily' },
      { path: '/services',        priority: '0.9',  changefreq: 'daily' },
      { path: '/mechanic',        priority: '0.9',  changefreq: 'daily' },
      { path: '/search',          priority: '0.8',  changefreq: 'weekly' },
      { path: '/about',           priority: '0.7',  changefreq: 'monthly' },
      { path: '/contact',         priority: '0.7',  changefreq: 'monthly' },
      { path: '/map',             priority: '0.7',  changefreq: 'weekly' },
      { path: '/map/services',    priority: '0.7',  changefreq: 'weekly' },
      { path: '/map/chargers',    priority: '0.75', changefreq: 'weekly' },
      { path: '/map/stations',    priority: '0.75', changefreq: 'weekly' },
      { path: '/map/laundries',   priority: '0.7',  changefreq: 'weekly' },
      { path: '/map/drives',      priority: '0.6',  changefreq: 'weekly' },
      { path: '/laundries',       priority: '0.8',  changefreq: 'weekly' },
      { path: '/category',        priority: '0.8',  changefreq: 'weekly' },
      { path: '/blog',            priority: '0.85', changefreq: 'daily' },
      { path: '/vacancies',       priority: '0.85', changefreq: 'daily' },
      { path: '/leasing',         priority: '0.8',  changefreq: 'weekly' },
      { path: '/dealers',         priority: '0.8',  changefreq: 'weekly' },
      { path: '/insurance',       priority: '0.8',  changefreq: 'weekly' },
      { path: '/fuel-importers',  priority: '0.7',  changefreq: 'weekly' },
      { path: '/fuel-brands',     priority: '0.75', changefreq: 'weekly' },
      { path: '/community',       priority: '0.7',  changefreq: 'daily' },
      { path: '/privacy-policy',  priority: '0.3',  changefreq: 'yearly' },
    ]

    let staticXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
    for (const p of STATIC_PAGES) {
      staticXml += `
  <url>
    <loc>${SITE}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
    }
    for (const c of categories || []) {
      const slug = createSlug((c as any).name)
      staticXml += `
  <url>
    <loc>${SITE}/category/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    }
    staticXml += `
</urlset>`

    // ============ sitemap-services.xml ============
    let servicesXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`
    for (const s of (services || []) as any[]) {
      let urlPart: string
      if (s.slug && /^\d+-/.test(s.slug)) {
        urlPart = s.slug
      } else {
        const slug = s.slug || createSlug(s.name)
        urlPart = slug ? `${s.id}-${slug}` : String(s.id)
      }
      const lastmod = s.updated_at ? new Date(s.updated_at).toISOString().split('T')[0] : today
      const priority = s.is_vip_active && s.vip_status === 'super_vip'
        ? '0.95'
        : s.is_vip_active && s.vip_status === 'vip'
        ? '0.85'
        : '0.75'
      const changefreq = s.is_vip_active ? 'daily' : 'weekly'

      const photos: string[] = Array.isArray(s.photos) ? s.photos.slice(0, 5) : []
      const imageBlocks = photos
        .filter((p: string) => typeof p === 'string' && p.startsWith('http'))
        .map((photo: string) => `
    <image:image>
      <image:loc>${xmlEscape(photo)}</image:loc>
      <image:title>${xmlEscape(s.name || '')}</image:title>
    </image:image>`)
        .join('')

      servicesXml += `
  <url>
    <loc>${SITE}/service/${urlPart}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageBlocks}
  </url>`
    }
    servicesXml += `
</urlset>`

    // ============ sitemap-mechanics.xml ============
    let mechanicsXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
    for (const m of (mechanics || []) as any[]) {
      const profile: any = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      const firstName = profile?.first_name || 'Mechanic'
      const lastName = profile?.last_name || ''
      const fullName = `${firstName} ${lastName}`.trim()
      const slug = createSlug(fullName)
      const urlPart = slug ? `${m.display_id}-${slug}` : String(m.display_id)
      const rating = Number(m.rating) || 0
      const verified = profile?.is_verified === true
      const priority = verified
        ? (rating >= 4.5 ? '0.85' : rating >= 4.0 ? '0.75' : '0.65')
        : '0.50'
      const lastmod = m.updated_at
        ? new Date(m.updated_at).toISOString().split('T')[0]
        : today
      mechanicsXml += `
  <url>
    <loc>${SITE}/mechanic/${urlPart}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`
    }
    mechanicsXml += `
</urlset>`

    // ============ sitemap-content.xml ============
    let contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`
    for (const p of (blogPosts || []) as any[]) {
      const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : today
      const views = p.view_count || 0
      const priority = views >= 1000 ? '0.80' : views >= 500 ? '0.75' : '0.70'
      const cover: string | null = p.featured_image
      const imageBlock = (cover && typeof cover === 'string' && cover.startsWith('http'))
        ? `
    <image:image>
      <image:loc>${xmlEscape(cover)}</image:loc>
      <image:title>${xmlEscape(p.title || '')}</image:title>
    </image:image>`
        : ''
      contentXml += `
  <url>
    <loc>${SITE}/blog/${p.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>${imageBlock}
  </url>`
    }
    for (const v of (vacancies || []) as any[]) {
      const ts = v.updated_at || v.created_at
      const lastmod = ts ? new Date(ts).toISOString().split('T')[0] : today
      contentXml += `
  <url>
    <loc>${SITE}/vacancy/${v.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.65</priority>
  </url>`
    }
    contentXml += `
</urlset>`

    // ============ sitemap.xml (INDEX) ============
    const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE}/sitemap-static.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE}/sitemap-services.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE}/sitemap-mechanics.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE}/sitemap-content.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`

    const encoder = new TextEncoder()
    const uploads: Array<[string, Uint8Array]> = [
      ['sitemap.xml',            encoder.encode(indexXml)],
      ['sitemap-index.xml',      encoder.encode(indexXml)],
      ['sitemap-static.xml',     encoder.encode(staticXml)],
      ['sitemap-services.xml',   encoder.encode(servicesXml)],
      ['sitemap-mechanics.xml',  encoder.encode(mechanicsXml)],
      ['sitemap-content.xml',    encoder.encode(contentXml)],
    ]

    for (const [path, data] of uploads) {
      const { error } = await supabase.storage
        .from('service-photos')
        .upload(path, data, { contentType: 'application/xml', upsert: true })
      if (error) {
        console.error(`Error uploading ${path}:`, error)
        throw error
      }
    }

    const breakdown = {
      static: STATIC_PAGES.length,
      categories: categories?.length || 0,
      services: services?.length || 0,
      mechanics: mechanics?.length || 0,
      blog: blogPosts?.length || 0,
      vacancies: vacancies?.length || 0,
    }
    const totalUrls = Object.values(breakdown).reduce((a, b) => a + b, 0)

    console.log(`Split sitemap generated: ${totalUrls} URLs across 4 child sitemaps`)
    console.log('Breakdown:', JSON.stringify(breakdown))

    return new Response(JSON.stringify({
      success: true,
      totalUrls,
      lastUpdate: today,
      breakdown: { ...breakdown, totalUrls },
      files: ['sitemap.xml', 'sitemap-static.xml', 'sitemap-services.xml', 'sitemap-mechanics.xml', 'sitemap-content.xml'],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Error generating sitemap:', error)
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
