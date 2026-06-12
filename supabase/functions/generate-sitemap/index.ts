import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createSlug } from '../_shared/slug.ts'

// RankMath-style sitemap generator (Supabase edge function).
//
// Writes 6 sub-sitemaps + index to the `service-photos` storage bucket:
//   sitemap_index.xml
//   static-sitemap.xml
//   service-sitemap.xml          (paginated as service-sitemap1.xml... if >2000)
//   mechanic-sitemap.xml
//   category-sitemap.xml
//   blog-sitemap.xml
//   vacancy-sitemap.xml
//
// Mirrors scripts/generate-sitemap.mjs — keep in sync.
//
// Runs daily at 3 AM via cron (see supabase/config.toml) and on-demand from
// the admin "Sitemap მართვა" panel.

const SITE_URL = 'https://fixup.ge'
const MAX_URLS_PER_SITEMAP = 2000
const XSL_HREF = '//fixup.ge/main-sitemap.xsl'
const BUCKET = 'service-photos'
// IndexNow key — file lives at public/{KEY}.txt for ownership verification.
const INDEXNOW_KEY = 'a3f7e2b9c4d6e8f1a2b3c4d5e6f78901'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const xmlEscape = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')

function isoLastmod(input?: string | Date | null): string {
  const d = input ? new Date(input) : new Date()
  if (Number.isNaN(d.getTime())) return new Date().toISOString().replace('Z', '+00:00')
  return d.toISOString().replace('Z', '+00:00')
}

function urlsetHeader(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${XSL_HREF}"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`
}

function sitemapIndexHeader(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${XSL_HREF}"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd">`
}

function urlEntry({ loc, lastmod, images = [] }: { loc: string; lastmod: string; images?: string[] }): string {
  const imageBlocks = (images || [])
    .filter((p) => typeof p === 'string' && p.startsWith('http'))
    .slice(0, 5)
    .map((img) => `
    <image:image>
      <image:loc>${xmlEscape(img)}</image:loc>
    </image:image>`)
    .join('')

  return `
  <url>
    <loc>${xmlEscape(loc)}</loc>
    <xhtml:link rel="alternate" hreflang="ka-ge" href="${xmlEscape(loc)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(loc)}" />
    <lastmod>${lastmod}</lastmod>${imageBlocks}
  </url>`
}

function wrapUrlset(entries: string[]): string {
  return `${urlsetHeader()}${entries.join('')}
</urlset>
`
}

const STATIC_PAGES = [
  '/', '/services', '/mechanic', '/search', '/about', '/contact', '/map',
  '/category', '/blog', '/vacancies', '/laundries', '/leasing', '/dealers',
  '/insurance', '/fuel-importers', '/fuel-brands', '/community', '/privacy-policy',
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const now = isoLastmod()

    // Parent <lastmod> in the index should reflect the latest content change in
    // the sub-sitemap, not the first row or current time. Google uses it to
    // decide whether to recrawl the whole sub-sitemap.
    const maxLastmod = (rows: any[] | null | undefined, fields: string[] = ['updated_at']): string => {
      let max = 0
      for (const r of rows || []) {
        for (const f of fields) {
          const t = r?.[f] ? new Date(r[f]).getTime() : 0
          if (t > max) max = t
        }
      }
      return max > 0 ? isoLastmod(new Date(max)) : now
    }

    const [
      { data: services, error: servicesErr },
      { data: categories, error: categoriesErr },
      { data: mechanics, error: mechanicsErr },
      { data: blogPosts, error: blogErr },
      { data: vacancies, error: vacanciesErr },
    ] = await Promise.all([
      supabase.from('mechanic_services')
        .select('id, name, slug, updated_at, photos')
        .eq('is_active', true)
        .order('id'),
      supabase.from('service_categories')
        .select('id, name')
        .order('id'),
      supabase.from('mechanic_profiles')
        .select('id, display_id, updated_at, profiles!inner(role, is_verified, first_name, last_name)')
        .eq('profiles.role', 'mechanic')
        .eq('profiles.is_verified', true)
        .order('display_id'),
      supabase.from('blog_posts')
        .select('slug, updated_at, featured_image')
        .eq('status', 'published')
        .order('published_at', { ascending: false }),
      supabase.from('mechanic_vacancies')
        .select('id, created_at, updated_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    ])

    for (const [name, err] of Object.entries({ servicesErr, categoriesErr, mechanicsErr, blogErr, vacanciesErr })) {
      if (err) console.error(`[sitemap] ${name}:`, (err as any).message)
    }

    const indexEntries: { filename: string; lastmod: string }[] = []
    const uploads: { filename: string; body: string }[] = []

    const queueSitemap = (filename: string, entries: string[], lastmod: string) => {
      if (entries.length === 0) return
      uploads.push({ filename, body: wrapUrlset(entries) })
      indexEntries.push({ filename, lastmod })
    }

    const queuePaginated = (baseName: string, entries: string[], lastmod: string) => {
      if (entries.length === 0) return
      if (entries.length <= MAX_URLS_PER_SITEMAP) {
        queueSitemap(`${baseName}-sitemap.xml`, entries, lastmod)
        return
      }
      const chunks: string[][] = []
      for (let i = 0; i < entries.length; i += MAX_URLS_PER_SITEMAP) {
        chunks.push(entries.slice(i, i + MAX_URLS_PER_SITEMAP))
      }
      queueSitemap(`${baseName}-sitemap.xml`, chunks[0], lastmod)
      for (let i = 1; i < chunks.length; i++) {
        queueSitemap(`${baseName}-sitemap${i}.xml`, chunks[i], lastmod)
      }
    }

    // ---- Static ----
    const staticEntries = STATIC_PAGES.map((path) =>
      urlEntry({ loc: `${SITE_URL}${path}`, lastmod: now })
    )
    queueSitemap('static-sitemap.xml', staticEntries, now)

    // ---- Services ----
    const serviceEntries = (services || []).map((s: any) => {
      let urlPart: string
      if (s.slug && /^\d+-/.test(s.slug)) {
        urlPart = s.slug
      } else {
        const slug = s.slug || createSlug(s.name)
        urlPart = slug ? `${s.id}-${slug}` : String(s.id)
      }
      const images = Array.isArray(s.photos) ? s.photos : []
      return urlEntry({
        loc: `${SITE_URL}/service/${urlPart}`,
        lastmod: isoLastmod(s.updated_at),
        images,
      })
    })
    queuePaginated('service', serviceEntries, maxLastmod(services))

    // ---- Mechanics ----
    const mechanicEntries = (mechanics || []).map((m: any) => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      const firstName = profile?.first_name || 'Mechanic'
      const lastName = profile?.last_name || ''
      const fullName = `${firstName} ${lastName}`.trim()
      const slug = createSlug(fullName)
      const urlPart = slug ? `${m.display_id}-${slug}` : String(m.display_id)
      return urlEntry({
        loc: `${SITE_URL}/mechanic/${urlPart}`,
        lastmod: isoLastmod(m.updated_at),
      })
    })
    queuePaginated('mechanic', mechanicEntries, maxLastmod(mechanics))

    // ---- Categories ----
    const categoryEntries = (categories || []).map((c: any) => {
      const slug = createSlug(c.name)
      return urlEntry({
        loc: `${SITE_URL}/category/${slug}`,
        lastmod: now,
      })
    })
    queuePaginated('category', categoryEntries, now)

    // ---- Blog ----
    const blogEntries = (blogPosts || []).map((p: any) =>
      urlEntry({
        loc: `${SITE_URL}/blog/${p.slug}`,
        lastmod: isoLastmod(p.updated_at),
        images: p.featured_image ? [p.featured_image] : [],
      })
    )
    queuePaginated('blog', blogEntries, maxLastmod(blogPosts))

    // ---- Vacancies ----
    const vacancyEntries = (vacancies || []).map((v: any) =>
      urlEntry({
        loc: `${SITE_URL}/vacancy/${v.id}`,
        lastmod: isoLastmod(v.updated_at || v.created_at),
      })
    )
    queuePaginated('vacancy', vacancyEntries, maxLastmod(vacancies, ['updated_at', 'created_at']))

    // ---- Index ----
    const indexBody = `${sitemapIndexHeader()}${indexEntries.map(({ filename, lastmod }) => `
  <sitemap>
    <loc>${SITE_URL}/${filename}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`).join('')}
</sitemapindex>
`
    uploads.push({ filename: 'sitemap_index.xml', body: indexBody })

    // Legacy pointer files — old Search Console submissions keep working.
    const legacyPointer = `${sitemapIndexHeader()}
  <sitemap>
    <loc>${SITE_URL}/sitemap_index.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>
`
    uploads.push({ filename: 'sitemap.xml', body: legacyPointer })
    uploads.push({ filename: 'sitemap-index.xml', body: legacyPointer })

    // ---- Upload all ----
    const encoder = new TextEncoder()
    for (const { filename, body } of uploads) {
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filename, encoder.encode(body), {
          contentType: 'application/xml',
          upsert: true,
        })
      if (error) {
        console.error(`[sitemap] upload ${filename}:`, error.message)
        throw error
      }
    }

    const counts = {
      static: staticEntries.length,
      services: serviceEntries.length,
      mechanics: mechanicEntries.length,
      categories: categoryEntries.length,
      blog: blogEntries.length,
      vacancies: vacancyEntries.length,
    }
    const totalUrls = Object.values(counts).reduce((a, b) => a + b, 0)
    const subSitemaps = indexEntries.length

    console.log(`[sitemap] ✓ ${subSitemaps} sub-sitemaps, ${totalUrls} URLs total`)

    // IndexNow ping — non-fatal. Bing + Yandex pick up new URLs faster.
    let indexNowStatus: number | null = null
    try {
      const res = await fetch('https://api.indexnow.org/IndexNow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: 'fixup.ge',
          key: INDEXNOW_KEY,
          keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
          urlList: [
            `${SITE_URL}/sitemap_index.xml`,
            ...indexEntries.map((e) => `${SITE_URL}/${e.filename}`),
          ],
        }),
      })
      indexNowStatus = res.status
      console.log(`[sitemap] IndexNow ping → ${res.status}`)
    } catch (err: any) {
      console.warn('[sitemap] IndexNow ping failed (non-fatal):', err?.message)
    }

    return new Response(JSON.stringify({
      success: true,
      totalUrls,
      subSitemaps,
      lastUpdate: now,
      breakdown: counts,
      sitemaps: indexEntries.map((e) => `${SITE_URL}/${e.filename}`),
      indexNowStatus,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('[sitemap] generation failed:', error)
    return new Response(JSON.stringify({
      error: error?.message || 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
