// Run after prerendering the location manifest; checks the actual emitted HTML.
import { readFileSync,writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
const root=new URL('../',import.meta.url);
const routes=JSON.parse(readFileSync(new URL('scripts/location-render-routes.json',root),'utf8'));
const sitemap=readFileSync(new URL('public/city-sitemap.xml',root),'utf8');
const indexed=new Set([...sitemap.matchAll(/<loc>https:\/\/fixup\.ge([^<]+)<\/loc>/g)].map(match=>match[1]));
for(const route of routes){
  const $=load(readFileSync(new URL(`dist${route}/index.html`,root),'utf8'));
  assert.equal($('link[rel="canonical"]').length,1,route);
  assert.equal($('link[rel="canonical"]').attr('href'),`https://fixup.ge${route}`,route);
  assert.equal($('h1').length,1,route);
  const robots=$('meta[name="robots"]').attr('content') || '';
  assert.equal(!robots.includes('noindex'),indexed.has(route),`${route}: ${robots}`);
  const schemas=$('script[type="application/ld+json"]').toArray().map(element=>JSON.parse($(element).text()));
  assert.ok(schemas.some(schema=>schema['@type']==='BreadcrumbList'),route);
  assert.ok($('[data-location-ready="true"]').length,route);
}
const brands=JSON.parse(readFileSync(new URL('src/data/brand-pages.json',root),'utf8'));
const brandSitemap=readFileSync(new URL('public/brand-sitemap.xml',root),'utf8');
for(const brand of brands){
  const path=`/brand/${brand.slug}`;
  const $=load(readFileSync(new URL(`dist${path}/index.html`,root),'utf8'));
  assert.equal($('link[rel="canonical"]').length,1,path);
  assert.equal($('link[rel="canonical"]').attr('href'),`https://fixup.ge${path}`,path);
  assert.equal($('h1').length,1,path);
  assert.equal(!($('meta[name="robots"]').attr('content') || '').includes('noindex'),brandSitemap.includes(`<loc>https://fixup.ge${path}</loc>`),path);
}
const report={brandPages:brands.length,routes:routes.length,indexable:indexed.size,noindex:routes.length-indexed.size,checks:['single exact canonical','single H1','robots policy matches sitemap','BreadcrumbList','data loaded before capture']};
writeFileSync(new URL('scripts/reports/location-seo-audit.json',root),JSON.stringify(report,null,2)+'\n');
console.log('PASS',report);
