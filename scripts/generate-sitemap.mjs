#!/usr/bin/env node
// Build-time sitemap generator.
//
// Mirrors supabase/functions/generate-sitemap/index.ts but runs in Node so
// the output lands in public/sitemap.xml at build time. Lovable hosting
// serves public/ files directly — there is no rewrite layer for the
// edge function — so a fresh static file is the only reliable way for
// Googlebot to see current URLs.
//
// Run manually:   npm run sitemap:generate
// Runs automatically before `npm run build` via the prebuild hook.
//
// Required env:
//   SUPABASE_URL                 (or VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY    (write/read all rows; never expose client-side)
//
// If env is missing the script skips regeneration and exits 0 — this
// avoids breaking dev-only builds where the key isn't available.

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SITE_URL = 'https://fixup.ge';

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

const xmlEscape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const STATIC_PAGES = [
  { path: '/',                priority: '1.0',  changefreq: 'daily' },
  { path: '/services',        priority: '0.9',  changefreq: 'daily' },
  { path: '/mechanic',        priority: '0.9',  changefreq: 'daily' },
  { path: '/search',          priority: '0.8',  changefreq: 'weekly' },
  { path: '/about',           priority: '0.7',  changefreq: 'monthly' },
  { path: '/contact',         priority: '0.7',  changefreq: 'monthly' },
  { path: '/map',             priority: '0.6',  changefreq: 'weekly' },
  { path: '/laundries',       priority: '0.8',  changefreq: 'weekly' },
  { path: '/category',        priority: '0.8',  changefreq: 'weekly' },
  { path: '/blog',            priority: '0.85', changefreq: 'daily' },
  { path: '/vacancies',       priority: '0.85', changefreq: 'daily' },
  { path: '/leasing',         priority: '0.8',  changefreq: 'weekly' },
  { path: '/dealers',         priority: '0.8',  changefreq: 'weekly' },
  { path: '/insurance',       priority: '0.8',  changefreq: 'weekly' },
  { path: '/fuel-importers',  priority: '0.8',  changefreq: 'weekly' },
  { path: '/fuel-brands',     priority: '0.75', changefreq: 'weekly' },
  { path: '/community',       priority: '0.7',  changefreq: 'daily' },
  { path: '/privacy-policy',  priority: '0.3',  changefreq: 'yearly' },
];

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.warn('[sitemap] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — skipping regeneration (keeping existing public/sitemap.xml).');
    process.exit(0);
  }

  // Lazy-import so the script doesn't crash before env check when deps aren't installed yet.
  let createClient;
  try {
    ({ createClient } = await import('@supabase/supabase-js'));
  } catch {
    console.warn('[sitemap] @supabase/supabase-js not installed — skipping. Run `npm install` first.');
    process.exit(0);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const today = new Date().toISOString().split('T')[0];

  const [
    { data: services, error: servicesErr },
    { data: categories, error: categoriesErr },
    { data: mechanics, error: mechanicsErr },
    { data: blogPosts, error: blogErr },
    { data: vacancies, error: vacanciesErr },
  ] = await Promise.all([
    supabase.from('mechanic_services')
      .select('id, name, slug, updated_at, is_vip_active, vip_status, photos')
      .eq('is_active', true)
      .order('id'),
    supabase.from('service_categories')
      .select('id, name')
      .order('id'),
    supabase.from('mechanic_profiles')
      .select('id, display_id, rating, updated_at, profiles!inner(role, is_verified, first_name, last_name)')
      .eq('profiles.role', 'mechanic')
      .eq('profiles.is_verified', true)
      .order('display_id'),
    supabase.from('blog_posts')
      .select('slug, updated_at, view_count')
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    supabase.from('mechanic_vacancies')
      .select('id, created_at, updated_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ]);

  for (const [name, err] of Object.entries({ servicesErr, categoriesErr, mechanicsErr, blogErr, vacanciesErr })) {
    if (err) {
      console.error(`[sitemap] ${name}:`, err.message);
      // Non-fatal: emit what we have.
    }
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Static pages -->`;

  for (const p of STATIC_PAGES) {
    xml += `
  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`;
  }

  xml += `

  <!-- Service detail pages -->`;
  for (const s of services || []) {
    let urlPart;
    if (s.slug && /^\d+-/.test(s.slug)) {
      urlPart = s.slug;
    } else {
      const slug = s.slug || createSlug(s.name);
      urlPart = slug ? `${s.id}-${slug}` : String(s.id);
    }
    const lastmod = s.updated_at ? new Date(s.updated_at).toISOString().split('T')[0] : today;
    const priority = s.is_vip_active && s.vip_status === 'super_vip'
      ? '0.95'
      : s.is_vip_active && s.vip_status === 'vip'
      ? '0.85'
      : '0.75';
    const changefreq = s.is_vip_active ? 'daily' : 'weekly';

    const photos = Array.isArray(s.photos) ? s.photos.slice(0, 5) : [];
    const imageBlocks = photos
      .filter((p) => typeof p === 'string' && p.startsWith('http'))
      .map((photo) => `
    <image:image>
      <image:loc>${xmlEscape(photo)}</image:loc>
      <image:title>${xmlEscape(s.name || '')}</image:title>
    </image:image>`)
      .join('');

    xml += `
  <url>
    <loc>${SITE_URL}/service/${urlPart}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageBlocks}
  </url>`;
  }

  xml += `

  <!-- Category pages -->`;
  for (const c of categories || []) {
    const slug = createSlug(c.name);
    xml += `
  <url>
    <loc>${SITE_URL}/category/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }

  xml += `

  <!-- Mechanic profile pages -->`;
  for (const m of mechanics || []) {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    const firstName = profile?.first_name || 'Mechanic';
    const lastName = profile?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const slug = createSlug(fullName);
    const urlPart = slug ? `${m.display_id}-${slug}` : String(m.display_id);
    const rating = Number(m.rating) || 0;
    const priority = rating >= 4.5 ? '0.85' : rating >= 4.0 ? '0.75' : '0.65';
    const lastmod = m.updated_at ? new Date(m.updated_at).toISOString().split('T')[0] : today;
    xml += `
  <url>
    <loc>${SITE_URL}/mechanic/${urlPart}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }

  xml += `

  <!-- Blog posts -->`;
  for (const p of blogPosts || []) {
    const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : today;
    const views = p.view_count || 0;
    const priority = views >= 1000 ? '0.80' : views >= 500 ? '0.75' : '0.70';
    xml += `
  <url>
    <loc>${SITE_URL}/blog/${p.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }

  xml += `

  <!-- Active vacancies -->`;
  for (const v of vacancies || []) {
    const ts = v.updated_at || v.created_at;
    const lastmod = ts ? new Date(ts).toISOString().split('T')[0] : today;
    xml += `
  <url>
    <loc>${SITE_URL}/vacancy/${v.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.65</priority>
  </url>`;
  }

  xml += `
</urlset>
`;

  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>
`;

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const publicDir = join(__dirname, '..', 'public');
  await writeFile(join(publicDir, 'sitemap.xml'), xml, 'utf8');
  await writeFile(join(publicDir, 'sitemap-index.xml'), indexXml, 'utf8');

  const counts = {
    static: STATIC_PAGES.length,
    services: services?.length || 0,
    categories: categories?.length || 0,
    mechanics: mechanics?.length || 0,
    blog: blogPosts?.length || 0,
    vacancies: vacancies?.length || 0,
  };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`[sitemap] ✓ Wrote public/sitemap.xml — ${total} URLs (${JSON.stringify(counts)})`);
}

main().catch((err) => {
  console.error('[sitemap] generation failed:', err);
  // Exit 0: don't break the build over sitemap failures. Existing static
  // file will continue to serve. CI logs will surface the error.
  process.exit(0);
});
