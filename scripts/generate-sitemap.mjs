#!/usr/bin/env node
// Build-time sitemap generator — RankMath-style split index + 4 child sitemaps.
//
// Outputs to public/:
//   sitemap.xml           → sitemap index (references the 4 children)
//   sitemap-index.xml     → alias of sitemap.xml (backward-compat)
//   sitemap-static.xml    → static routes + /map sub-tabs + categories
//   sitemap-services.xml  → service detail pages + image sitemap
//   sitemap-mechanics.xml → ALL mechanic profile pages
//   sitemap-content.xml   → blog posts (with cover image) + vacancies

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SITE_URL = 'https://fixup.ge';

const georgianToLatin = {
  'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 't',
  'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh',
  'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'p', 'ქ': 'q', 'ღ': 'gh', 'ყ': 'q',
  'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
};

function createSlug(text) {
  if (!text) return '';
  return text.toLowerCase().split('').map(c => georgianToLatin[c] || c).join('')
    .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
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
    console.warn('[sitemap] @supabase/supabase-js not installed — skipping.');
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
      .eq('is_active', true).order('id'),
    supabase.from('service_categories').select('id, name').order('id'),
    supabase.from('mechanic_profiles')
      .select('id, display_id, rating, updated_at, profiles!inner(role, is_verified, first_name, last_name)')
      .eq('profiles.role', 'mechanic').order('display_id'),
    supabase.from('blog_posts')
      .select('slug, updated_at, view_count, featured_image, title')
      .eq('status', 'published').order('published_at', { ascending: false }),
    supabase.from('mechanic_vacancies')
      .select('id, created_at, updated_at')
      .eq('is_active', true).order('created_at', { ascending: false }),
  ]);

  for (const [name, err] of Object.entries({ servicesErr, categoriesErr, mechanicsErr, blogErr, vacanciesErr })) {
    if (err) console.error(`[sitemap] ${name}:`, err.message);
  }

  // ---------- sitemap-static.xml ----------
  let staticXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  for (const p of STATIC_PAGES) {
    staticXml += `
  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`;
  }
  for (const c of categories || []) {
    const slug = createSlug(c.name);
    staticXml += `
  <url>
    <loc>${SITE_URL}/category/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }
  staticXml += `
</urlset>
`;

  // ---------- sitemap-services.xml ----------
  let servicesXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;
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

    servicesXml += `
  <url>
    <loc>${SITE_URL}/service/${urlPart}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageBlocks}
  </url>`;
  }
  servicesXml += `
</urlset>
`;

  // ---------- sitemap-mechanics.xml ----------
  let mechanicsXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  for (const m of mechanics || []) {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    const firstName = profile?.first_name || 'Mechanic';
    const lastName = profile?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const slug = createSlug(fullName);
    const urlPart = slug ? `${m.display_id}-${slug}` : String(m.display_id);
    const rating = Number(m.rating) || 0;
    const verified = profile?.is_verified === true;
    const priority = verified
      ? (rating >= 4.5 ? '0.85' : rating >= 4.0 ? '0.75' : '0.65')
      : '0.50';
    const lastmod = m.updated_at ? new Date(m.updated_at).toISOString().split('T')[0] : today;
    mechanicsXml += `
  <url>
    <loc>${SITE_URL}/mechanic/${urlPart}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }
  mechanicsXml += `
</urlset>
`;

  // ---------- sitemap-content.xml ----------
  let contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;
  for (const p of blogPosts || []) {
    const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : today;
    const views = p.view_count || 0;
    const priority = views >= 1000 ? '0.80' : views >= 500 ? '0.75' : '0.70';
    const cover = p.featured_image;
    const imageBlock = (cover && typeof cover === 'string' && cover.startsWith('http'))
      ? `
    <image:image>
      <image:loc>${xmlEscape(cover)}</image:loc>
      <image:title>${xmlEscape(p.title || '')}</image:title>
    </image:image>`
      : '';
    contentXml += `
  <url>
    <loc>${SITE_URL}/blog/${p.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>${imageBlock}
  </url>`;
  }
  for (const v of vacancies || []) {
    const ts = v.updated_at || v.created_at;
    const lastmod = ts ? new Date(ts).toISOString().split('T')[0] : today;
    contentXml += `
  <url>
    <loc>${SITE_URL}/vacancy/${v.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.65</priority>
  </url>`;
  }
  contentXml += `
</urlset>
`;

  // ---------- sitemap.xml (INDEX) ----------
  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-static.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-services.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-mechanics.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-content.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>
`;

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const publicDir = join(__dirname, '..', 'public');

  await Promise.all([
    writeFile(join(publicDir, 'sitemap.xml'),           indexXml,     'utf8'),
    writeFile(join(publicDir, 'sitemap-index.xml'),     indexXml,     'utf8'),
    writeFile(join(publicDir, 'sitemap-static.xml'),    staticXml,    'utf8'),
    writeFile(join(publicDir, 'sitemap-services.xml'),  servicesXml,  'utf8'),
    writeFile(join(publicDir, 'sitemap-mechanics.xml'), mechanicsXml, 'utf8'),
    writeFile(join(publicDir, 'sitemap-content.xml'),   contentXml,   'utf8'),
  ]);

  const counts = {
    static: STATIC_PAGES.length,
    categories: categories?.length || 0,
    services: services?.length || 0,
    mechanics: mechanics?.length || 0,
    blog: blogPosts?.length || 0,
    vacancies: vacancies?.length || 0,
  };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`[sitemap] ✓ Wrote split sitemap — ${total} URLs (${JSON.stringify(counts)})`);
}

main().catch((err) => {
  console.error('[sitemap] generation failed:', err);
  process.exit(0);
});
