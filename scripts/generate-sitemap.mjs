#!/usr/bin/env node
// RankMath-style sitemap generator (build-time).
//
// Writes to public/:
//   sitemap_index.xml          — master index (underscore, RankMath convention)
//   static-sitemap.xml         — landing pages
//   service-sitemap.xml        — services (paginated as service-sitemap1.xml... if >2000)
//   mechanic-sitemap.xml       — verified mechanics
//   category-sitemap.xml       — service categories
//   blog-sitemap.xml           — published posts
//   vacancy-sitemap.xml        — active vacancies
//   main-sitemap.xsl           — XSL stylesheet (created separately)
//
// Mirrors supabase/functions/generate-sitemap/index.ts — keep in sync.
//
// Run manually:   npm run sitemap:generate
// Auto-runs before `npm run build` via prebuild hook.
//
// Required env:
//   SUPABASE_URL                 (or VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY    (read all rows; never expose client-side)
//
// Missing env → script skips regeneration (exit 0) so dev builds don't break.

import { writeFile, unlink, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SITE_URL = 'https://fixup.ge';
const MAX_URLS_PER_SITEMAP = 2000;
const XSL_HREF = '//fixup.ge/main-sitemap.xsl';
// IndexNow key — file lives at public/{KEY}.txt for ownership verification.
const INDEXNOW_KEY = 'a3f7e2b9c4d6e8f1a2b3c4d5e6f78901';

// District landing pages — mirror src/utils/districts.ts. Keep in sync.
// Only districts with ≥10 services site-wide qualify; the per-category
// combination still needs ≥1 service for its URL to ship.
const DISTRICTS = [
  { slug: 'gldani',      name: 'გლდანი' },
  { slug: 'varketili',   name: 'ვარკეთილი' },
  { slug: 'digomi',      name: 'დიღომი' },
  { slug: 'didube',      name: 'დიდუბე' },
  { slug: 'saburtalo',   name: 'საბურთალო' },
  { slug: 'nadzaladevi', name: 'ნაძალადევი' },
  { slug: 'samgori',     name: 'სამგორი' },
  { slug: 'isani',       name: 'ისანი' },
  { slug: 'chughureti',  name: 'ჩუღურეთი' },
];
const DISTRICT_NAME_TO_SLUG = Object.fromEntries(DISTRICTS.map((d) => [d.name, d.slug]));

// Brand landing pages — mirror src/utils/carBrands.ts. Keep in sync.
// A brand URL ships only when it has ≥ BRAND_MIN_SPECIALISTS *specialist*
// services (services tagging ≤ SPECIALIST_MAX brands) — the "all brands" crowd
// is noise and would make every brand page near-duplicate.
const SPECIALIST_MAX = 5;
const BRAND_MIN_SPECIALISTS = 5;
const BRAND_PAGES = [
  { name: 'Ford', slug: 'ford' }, { name: 'Toyota', slug: 'toyota' },
  { name: 'Lincoln', slug: 'lincoln' }, { name: 'Chevrolet', slug: 'chevrolet' },
  { name: 'Lexus', slug: 'lexus' }, { name: 'Buick', slug: 'buick' },
  { name: 'Cadillac', slug: 'cadillac' }, { name: 'GMC', slug: 'gmc' },
  { name: 'Opel', slug: 'opel' }, { name: 'Tesla', slug: 'tesla' },
  { name: 'Audi', slug: 'audi' }, { name: 'Volkswagen', slug: 'volkswagen' },
  { name: 'Mercedes-Benz', slug: 'mercedes-benz' }, { name: 'Skoda', slug: 'skoda' },
  { name: 'Kia', slug: 'kia' }, { name: 'Hyundai', slug: 'hyundai' },
];
const BRAND_NAME_TO_SLUG = Object.fromEntries(BRAND_PAGES.map((b) => [b.name, b.slug]));

// Keep in sync with src/utils/slugUtils.ts AND supabase/functions/_shared/slug.ts.
const georgianToLatin = {
  'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 't',
  'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh',
  'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'p', 'ქ': 'q', 'ღ': 'gh', 'ყ': 'q',
  'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
};

function createSlug(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .split('')
    .map(c => georgianToLatin[c] || c)
    .join('')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---- SEO indexability thresholds (Phase 2 #10/#13/#14) ----
// MIRROR of src/utils/seoQuality.ts. A URL ships in the sitemap ONLY if it
// clears these bars, so sitemap membership matches the page's own robots
// directive (thin pages render noindex,follow). Keep both files in sync.
//
// Tuned to fixup.ge's real data: verified_at (0/248) and specialization (7/248)
// are unpopulated, so they are NOT gates — the real completeness signals are a
// city, a description, or an active service.
const MIN_DESCRIPTION_LEN = 20;

function isServiceIndexable(s) {
  if (s.is_active === false) return false;
  if (!(s.name || '').trim()) return false;
  if (s.category_id == null) return false;
  const desc = (s.description || '').trim();
  const photoCount = Array.isArray(s.photos) ? s.photos.length : 0;
  if (desc.length < MIN_DESCRIPTION_LEN && photoCount === 0) return false;
  return true;
}

function isMechanicIndexable(m, hasActiveService) {
  if (m.display_id == null) return false;
  if (!(m.first_name || '').trim()) return false;
  const hasLocation = !!(m.city || '').trim();
  const hasDescription = !!(m.description || '').trim();
  return hasLocation || hasDescription || !!hasActiveService;
}

const xmlEscape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// ISO 8601 with timezone offset, e.g. 2026-06-12T10:15:30+00:00
function isoLastmod(input) {
  const d = input ? new Date(input) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString().replace('Z', '+00:00');
  return d.toISOString().replace('Z', '+00:00');
}

// urlset header — 4 namespaces, RankMath-style
function urlsetHeader() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${XSL_HREF}"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`;
}

// Video sitemap urlset header — adds the video namespace.
function videoUrlsetHeader() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${XSL_HREF}"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`;
}

function sitemapIndexHeader() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${XSL_HREF}"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd">`;
}

// Build a single <url> entry — RankMath structure (no priority/changefreq).
// images: array of absolute URL strings.
function urlEntry({ loc, lastmod, images = [] }) {
  const imageBlocks = (images || [])
    .filter((p) => typeof p === 'string' && p.startsWith('http'))
    .slice(0, 5)
    .map((img) => `
    <image:image>
      <image:loc>${xmlEscape(img)}</image:loc>
    </image:image>`)
    .join('');

  return `
  <url>
    <loc>${xmlEscape(loc)}</loc>
    <xhtml:link rel="alternate" hreflang="ka-ge" href="${xmlEscape(loc)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(loc)}" />
    <lastmod>${lastmod}</lastmod>${imageBlocks}
  </url>`;
}

function wrapUrlset(entries) {
  return `${urlsetHeader()}${entries.join('')}
</urlset>
`;
}

function wrapVideoUrlset(entries) {
  return `${videoUrlsetHeader()}${entries.join('')}
</urlset>
`;
}

// Build a video <url> entry per Google's video sitemap spec.
// One <url> per page; multiple <video:video> blocks if the page has many videos.
// thumbnail_loc, title, description, content_loc are REQUIRED.
function videoUrlEntry({ loc, lastmod, videos, thumbnail, title, description, publicationDate }) {
  const cdata = (s) => `<![CDATA[${String(s ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
  const blocks = videos
    .filter((v) => typeof v === 'string' && v.startsWith('http'))
    .map((video) => `
    <video:video>
      <video:thumbnail_loc>${xmlEscape(thumbnail)}</video:thumbnail_loc>
      <video:title>${cdata(title)}</video:title>
      <video:description>${cdata(description || title)}</video:description>
      <video:content_loc>${xmlEscape(video)}</video:content_loc>${publicationDate ? `
      <video:publication_date>${publicationDate}</video:publication_date>` : ''}
      <video:family_friendly>yes</video:family_friendly>
    </video:video>`)
    .join('');

  return `
  <url>
    <loc>${xmlEscape(loc)}</loc>
    <xhtml:link rel="alternate" hreflang="ka-ge" href="${xmlEscape(loc)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(loc)}" />
    <lastmod>${lastmod}</lastmod>${blocks}
  </url>`;
}

// Static pages — single landing pages with real, organic search intent.
// EXCLUDED (Phase 2 #12 — sitemap cleanup):
//   • /search               — query-based results page, no standalone intent
//   • /map/{services,laundries,drives,chargers,stations} — utility map TABS
//     (client-side tab switches of the same /map shell); the base /map ships
//   • /laundries            — feature currently hidden in the UI
// Keep in sync with validTabs in src/pages/Map.tsx.
const STATIC_PAGES = [
  '/',
  '/services',
  '/mechanic',
  '/about',
  '/contact',
  '/map',
  '/category',
  '/blog',
  '/vacancies',
  '/leasing',
  '/dealers',
  '/insurance',
  '/fuel-importers',
  '/fuel-brands',
  '/community',
  '/privacy-policy',
];

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.warn('[sitemap] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — skipping regeneration.');
    process.exit(0);
  }

  let createClient;
  try {
    ({ createClient } = await import('@supabase/supabase-js'));
  } catch {
    console.warn('[sitemap] @supabase/supabase-js not installed — skipping. Run `npm install` first.');
    process.exit(0);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const now = isoLastmod(new Date());

  // Parent <lastmod> in the index should reflect the latest content change in
  // the sub-sitemap, not the first row or current time. Google uses it to
  // decide whether to recrawl the whole sub-sitemap.
  const maxLastmod = (rows, fields = ['updated_at']) => {
    let max = 0;
    for (const r of rows || []) {
      for (const f of fields) {
        const t = r?.[f] ? new Date(r[f]).getTime() : 0;
        if (t > max) max = t;
      }
    }
    return max > 0 ? isoLastmod(new Date(max)) : now;
  };

  const [
    { data: services, error: servicesErr },
    { data: categories, error: categoriesErr },
    { data: mechanics, error: mechanicsErr },
    { data: blogPosts, error: blogErr },
    { data: vacancies, error: vacanciesErr },
  ] = await Promise.all([
    supabase.from('mechanic_services')
      .select('id, name, slug, description, updated_at, created_at, photos, videos, category_id, district, mechanic_id, car_brands')
      .eq('is_active', true)
      .order('id'),
    supabase.from('service_categories')
      .select('id, name')
      .order('id'),
    supabase.from('mechanic_profiles')
      .select('id, display_id, description, updated_at, profiles!inner(role, first_name, last_name, city)')
      .eq('profiles.role', 'mechanic')
      .order('display_id'),
    supabase.from('blog_posts')
      .select('slug, updated_at, featured_image')
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    supabase.from('mechanic_vacancies')
      .select('id, created_at, updated_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ]);

  for (const [name, err] of Object.entries({ servicesErr, categoriesErr, mechanicsErr, blogErr, vacanciesErr })) {
    if (err) console.error(`[sitemap] ${name}:`, err.message);
  }

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const publicDir = join(__dirname, '..', 'public');

  // Track generated sub-sitemaps for the index.
  const indexEntries = [];

  const writeSitemap = async (filename, entries, lastmod) => {
    if (entries.length === 0) return; // skip empty — Google warns on 0-URL sitemaps
    await writeFile(join(publicDir, filename), wrapUrlset(entries), 'utf8');
    indexEntries.push({ filename, lastmod });
  };

  const writeVideoSitemap = async (filename, entries, lastmod) => {
    if (entries.length === 0) return;
    await writeFile(join(publicDir, filename), wrapVideoUrlset(entries), 'utf8');
    indexEntries.push({ filename, lastmod });
  };

  // Split entries into multiple files if over MAX_URLS_PER_SITEMAP.
  // Pagination follows RankMath convention: foo-sitemap.xml, foo-sitemap1.xml, foo-sitemap2.xml
  const writePaginated = async (baseName, entries, lastmod) => {
    if (entries.length === 0) return;
    if (entries.length <= MAX_URLS_PER_SITEMAP) {
      await writeSitemap(`${baseName}-sitemap.xml`, entries, lastmod);
      return;
    }
    const chunks = [];
    for (let i = 0; i < entries.length; i += MAX_URLS_PER_SITEMAP) {
      chunks.push(entries.slice(i, i + MAX_URLS_PER_SITEMAP));
    }
    // First chunk: foo-sitemap.xml. Subsequent: foo-sitemap1.xml, foo-sitemap2.xml...
    await writeSitemap(`${baseName}-sitemap.xml`, chunks[0], lastmod);
    for (let i = 1; i < chunks.length; i++) {
      await writeSitemap(`${baseName}-sitemap${i}.xml`, chunks[i], lastmod);
    }
  };

  // ---- Static pages ----
  const staticEntries = STATIC_PAGES.map((path) =>
    urlEntry({ loc: `${SITE_URL}${path}`, lastmod: now })
  );
  await writeSitemap('static-sitemap.xml', staticEntries, now);

  // ---- Services ---- (#14 quality filter: active + name + category + real content)
  const indexableServices = (services || []).filter(isServiceIndexable);
  const excludedServiceCount = (services?.length || 0) - indexableServices.length;
  const serviceEntries = indexableServices.map((s) => {
    let urlPart;
    if (s.slug && /^\d+-/.test(s.slug)) {
      urlPart = s.slug;
    } else {
      const slug = s.slug || createSlug(s.name);
      urlPart = slug ? `${s.id}-${slug}` : String(s.id);
    }
    const images = Array.isArray(s.photos) ? s.photos : [];
    return urlEntry({
      loc: `${SITE_URL}/service/${urlPart}`,
      lastmod: isoLastmod(s.updated_at),
      images,
    });
  });
  await writePaginated('service', serviceEntries, maxLastmod(services));

  // ---- Mechanics ---- (#13 quality filter: display_id + name + (city|desc|active service))
  const mechanicsWithActiveService = new Set(
    (services || []).map((s) => s.mechanic_id).filter(Boolean)
  );
  const indexableMechanics = (mechanics || []).filter((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return isMechanicIndexable(
      { display_id: m.display_id, first_name: profile?.first_name, city: profile?.city, description: m.description },
      mechanicsWithActiveService.has(m.id)
    );
  });
  const excludedMechanicCount = (mechanics?.length || 0) - indexableMechanics.length;
  const mechanicEntries = indexableMechanics.map((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    const firstName = profile?.first_name || 'Mechanic';
    const lastName = profile?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const slug = createSlug(fullName);
    const urlPart = slug ? `${m.display_id}-${slug}` : String(m.display_id);
    return urlEntry({
      loc: `${SITE_URL}/mechanic/${urlPart}`,
      lastmod: isoLastmod(m.updated_at),
    });
  });
  await writePaginated('mechanic', mechanicEntries, maxLastmod(mechanics));

  // ---- Categories + district landing pages ----
  // service_categories has no updated_at; use current timestamp as fallback.
  // Parent category URL ships first, then any (category, district) combination
  // that has at least one active service. Empty combinations are skipped so
  // Google never crawls a "0 services" landing page.
  const categoryEntries = [];
  // Pre-index services by (category_id → district name → count) so we don't
  // re-scan the full list once per category.
  const districtsByCategory = new Map();
  for (const s of services || []) {
    if (!s.category_id || !s.district) continue;
    const districtSlug = DISTRICT_NAME_TO_SLUG[s.district];
    if (!districtSlug) continue; // unsupported district — skip
    if (!districtsByCategory.has(s.category_id)) {
      districtsByCategory.set(s.category_id, new Set());
    }
    districtsByCategory.get(s.category_id).add(districtSlug);
  }
  for (const c of categories || []) {
    const categorySlug = createSlug(c.name);
    categoryEntries.push(urlEntry({
      loc: `${SITE_URL}/category/${categorySlug}`,
      lastmod: now,
    }));
    const activeDistricts = districtsByCategory.get(c.id);
    if (activeDistricts) {
      for (const districtSlug of activeDistricts) {
        categoryEntries.push(urlEntry({
          loc: `${SITE_URL}/category/${categorySlug}/${districtSlug}`,
          lastmod: now,
        }));
      }
    }
  }
  await writePaginated('category', categoryEntries, now);

  // ---- Brand landing pages ---- (/brand/:slug)
  // Count specialist services per brand (services tagging ≤ SPECIALIST_MAX
  // brands). A brand ships only when it clears BRAND_MIN_SPECIALISTS, so brand
  // pages carry genuinely distinct listings instead of the "all brands" set.
  const brandSpecialistCounts = new Map();
  // brandSlug -> districtSlug -> specialist count (for /brand/:slug/:district).
  const brandDistrictCounts = new Map();
  for (const s of services || []) {
    const brands = Array.isArray(s.car_brands) ? s.car_brands : [];
    if (brands.length === 0 || brands.length > SPECIALIST_MAX) continue;
    const districtSlug = s.district ? DISTRICT_NAME_TO_SLUG[s.district] : null;
    for (const raw of brands) {
      const slug = BRAND_NAME_TO_SLUG[(raw || '').trim()];
      if (!slug) continue;
      brandSpecialistCounts.set(slug, (brandSpecialistCounts.get(slug) || 0) + 1);
      if (districtSlug) {
        if (!brandDistrictCounts.has(slug)) brandDistrictCounts.set(slug, new Map());
        const dm = brandDistrictCounts.get(slug);
        dm.set(districtSlug, (dm.get(districtSlug) || 0) + 1);
      }
    }
  }
  const brandEntries = [];
  // Hub page first, then each qualifying brand + its qualifying districts.
  brandEntries.push(urlEntry({ loc: `${SITE_URL}/brand`, lastmod: now }));
  for (const b of BRAND_PAGES) {
    if ((brandSpecialistCounts.get(b.slug) || 0) < BRAND_MIN_SPECIALISTS) continue;
    brandEntries.push(urlEntry({ loc: `${SITE_URL}/brand/${b.slug}`, lastmod: now }));
    const dm = brandDistrictCounts.get(b.slug);
    if (dm) {
      for (const [districtSlug, count] of dm) {
        if (count >= BRAND_MIN_SPECIALISTS) {
          brandEntries.push(urlEntry({ loc: `${SITE_URL}/brand/${b.slug}/${districtSlug}`, lastmod: now }));
        }
      }
    }
  }
  await writePaginated('brand', brandEntries, now);

  // ---- Blog posts ----
  const blogEntries = (blogPosts || []).map((p) =>
    urlEntry({
      loc: `${SITE_URL}/blog/${p.slug}`,
      lastmod: isoLastmod(p.updated_at),
      images: p.featured_image ? [p.featured_image] : [],
    })
  );
  await writePaginated('blog', blogEntries, maxLastmod(blogPosts));

  // ---- Vacancies ----
  const vacancyEntries = (vacancies || []).map((v) =>
    urlEntry({
      loc: `${SITE_URL}/vacancy/${v.id}`,
      lastmod: isoLastmod(v.updated_at || v.created_at),
    })
  );
  await writePaginated('vacancy', vacancyEntries, maxLastmod(vacancies, ['updated_at', 'created_at']));

  // ---- Videos ----
  // Google requires thumbnail + title + description + content_loc per video.
  // Skip services without a usable thumbnail (first http(s) photo).
  const servicesWithVideos = (services || []).filter((s) => {
    const v = Array.isArray(s.videos) ? s.videos : [];
    const p = Array.isArray(s.photos) ? s.photos : [];
    return v.some((x) => typeof x === 'string' && x.startsWith('http'))
      && p.some((x) => typeof x === 'string' && x.startsWith('http'));
  });

  const videoEntries = servicesWithVideos.map((s) => {
    let urlPart;
    if (s.slug && /^\d+-/.test(s.slug)) {
      urlPart = s.slug;
    } else {
      const slug = s.slug || createSlug(s.name);
      urlPart = slug ? `${s.id}-${slug}` : String(s.id);
    }
    const thumbnail = s.photos.find((p) => typeof p === 'string' && p.startsWith('http'));
    return videoUrlEntry({
      loc: `${SITE_URL}/service/${urlPart}`,
      lastmod: isoLastmod(s.updated_at),
      videos: s.videos,
      thumbnail,
      title: s.name,
      description: s.description,
      publicationDate: isoLastmod(s.created_at || s.updated_at),
    });
  });
  await writeVideoSitemap('video-sitemap.xml', videoEntries, maxLastmod(servicesWithVideos));

  // ---- Sitemap index ----
  const indexXml = `${sitemapIndexHeader()}${indexEntries.map(({ filename, lastmod }) => `
  <sitemap>
    <loc>${SITE_URL}/${filename}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`).join('')}
</sitemapindex>
`;
  await writeFile(join(publicDir, 'sitemap_index.xml'), indexXml, 'utf8');

  // ---- Backward-compat shims ----
  // Old robots.txt referenced /sitemap.xml and /sitemap-index.xml. Browsers can't
  // 301-redirect static files without server config — we serve a 1-line index
  // pointing to sitemap_index.xml so Search Console submissions continue working.
  const legacyPointer = `${sitemapIndexHeader()}
  <sitemap>
    <loc>${SITE_URL}/sitemap_index.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>
`;
  await writeFile(join(publicDir, 'sitemap.xml'), legacyPointer, 'utf8');
  await writeFile(join(publicDir, 'sitemap-index.xml'), legacyPointer, 'utf8');

  // Remove stale paginated files from previous runs (e.g. service-sitemap5.xml
  // if data shrank). Only delete files matching our managed naming.
  const managed = new Set([
    'sitemap.xml',
    'sitemap-index.xml',
    'sitemap_index.xml',
    'main-sitemap.xsl',
    ...indexEntries.map((e) => e.filename),
  ]);
  const dir = await readdir(publicDir);
  for (const f of dir) {
    if (/^(static|service|mechanic|category|blog|vacancy|video)-sitemap\d*\.xml$/.test(f) && !managed.has(f)) {
      await unlink(join(publicDir, f)).catch(() => {});
      console.log(`[sitemap] removed stale ${f}`);
    }
  }

  const counts = {
    static: staticEntries.length,
    services: serviceEntries.length,
    mechanics: mechanicEntries.length,
    categories: categoryEntries.length,
    brands: brandEntries.length,
    blog: blogEntries.length,
    vacancies: vacancyEntries.length,
    videos: videoEntries.length,
  };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`[sitemap] ✓ Wrote ${indexEntries.length} sub-sitemaps, ${total} URLs total`);
  console.log(`[sitemap] breakdown: ${JSON.stringify(counts)}`);
  // Audit (#10): report how many rows were excluded by the quality filters so a
  // sudden drop (e.g. a bad migration) is visible in the build log.
  console.log(`[sitemap] quality-filter excluded → services: ${excludedServiceCount}/${services?.length || 0}, mechanics: ${excludedMechanicCount}/${mechanics?.length || 0} (kept as noindex,follow)`);

  // IndexNow ping — non-fatal. Bing + Yandex pick up new URLs faster.
  // Skipped on build-time runs (CI doesn't need to ping) unless explicit env flag.
  if (process.env.SITEMAP_PING_INDEXNOW === '1') {
    await pingIndexNow(indexEntries.map((e) => `${SITE_URL}/${e.filename}`));
  }
}

async function pingIndexNow(urlList) {
  const body = {
    host: 'fixup.ge',
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: [`${SITE_URL}/sitemap_index.xml`, ...urlList],
  };
  try {
    const res = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log(`[sitemap] IndexNow ping → ${res.status}`);
  } catch (err) {
    console.warn('[sitemap] IndexNow ping failed (non-fatal):', err?.message);
  }
}

main().catch((err) => {
  console.error('[sitemap] generation failed:', err);
  process.exit(0);
});
