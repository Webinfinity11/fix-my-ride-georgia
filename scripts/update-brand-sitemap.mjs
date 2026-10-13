// Refresh brand URLs from public catalogue data, even without a service-role key.
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const root = new URL('../', import.meta.url);
const brands = JSON.parse(await readFile(new URL('src/data/brand-pages.json', root), 'utf8'));
const rules = JSON.parse(await readFile(new URL('src/data/brand-indexing.json', root), 'utf8'));
const districtsSource = await readFile(new URL('src/utils/districts.ts', root), 'utf8');
const districts = new Map([...districtsSource.matchAll(/slug:\s*'([^']+)',\s*name:\s*'([^']+)'/g)].map(([, slug, name]) => [name, slug]));
export function brandUrls(services) {
  const urls = ['https://fixup.ge/brand'];
  for (const brand of brands) {
    const matching = services.filter(s => Array.isArray(s.car_brands) && s.car_brands.length > 0 && s.car_brands.length <= rules.specialistMaxBrands && s.car_brands.includes(brand.name));
    if (matching.length < rules.minimumServices) continue;
    urls.push(`https://fixup.ge/brand/${brand.slug}`);
    for (const [name, slug] of districts) {
      if (matching.filter(s => s.district === name).length >= rules.minimumServices) urls.push(`https://fixup.ge/brand/${brand.slug}/${slug}`);
    }
  }
  return urls;
}
async function main() {
  const source = await readFile(new URL('src/integrations/supabase/client.ts', root), 'utf8');
  const url = source.match(/SUPABASE_URL = "([^"]+)"/)?.[1];
  const key = source.match(/SUPABASE_PUBLISHABLE_KEY = "([^"]+)"/)?.[1];
  if (!url || !key) throw new Error('Public app client configuration not found');
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from('mechanic_services').select('id,car_brands,district').eq('is_active', true).order('id').range(offset, offset + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  const file = new URL('public/brand-sitemap.xml', root);
  const previous = await readFile(file, 'utf8');
  const previousUrls = [...previous.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  const urls = brandUrls(rows);
  if (JSON.stringify(previousUrls) === JSON.stringify(urls)) { console.log(`[brand sitemap] ${urls.length} URLs unchanged`); return; }
  const now = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="//fixup.ge/main-sitemap.xsl"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(loc => `  <url><loc>${loc}</loc><lastmod>${now}</lastmod></url>`).join('\n')}\n</urlset>\n`;
  await writeFile(file, xml);
  for (const name of ['sitemap_index.xml', 'sitemap-index.xml', 'sitemap.xml']) {
    const path = new URL(`public/${name}`, root);
    const index = await readFile(path, 'utf8');
    await writeFile(path, index.replace(/(<loc>https:\/\/fixup\.ge\/brand-sitemap\.xml<\/loc>\s*<lastmod>)[^<]+/, `$1${now}`));
  }
  console.log(`[brand sitemap] ${urls.length} qualifying URLs refreshed`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
