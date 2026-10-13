import { readFile,writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { modelRoutes } from './model-routes.mjs';
const root=new URL('../',import.meta.url);
const source=await readFile(new URL('src/integrations/supabase/client.ts',root),'utf8');
const url=source.match(/SUPABASE_URL = "([^"]+)"/)?.[1];
const key=source.match(/SUPABASE_PUBLISHABLE_KEY = "([^"]+)"/)?.[1];
if(!url || !key) throw new Error('Public client configuration unavailable');
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const services=[];
for(let from=0;;from+=1000) {
 const {data,error}=await client.from('mechanic_services').select('id,car_brands,vehicle_models,category_id,district').eq('is_active',true).order('id').range(from,from+999);
 if(error) throw error;
 services.push(...data); if(data.length<1000) break;
}
const {data:categories,error}=await client.from('service_categories').select('id,name');
if(error) throw error;
const routes=modelRoutes(services,categories || []);
const file=new URL('public/model-sitemap.xml',root);
const previous=await readFile(file,'utf8').catch(()=>null);
const locs=routes.map(path=>`https://fixup.ge${path}`);
const previousLocs=[...(previous || '').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
const now=new Date().toISOString();
const changed=!previous || JSON.stringify(locs)!==JSON.stringify(previousLocs);
if(changed) await writeFile(file,`<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="//fixup.ge/main-sitemap.xsl"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locs.map(loc=>`<url><loc>${loc}</loc><lastmod>${now}</lastmod></url>`).join('\n')}\n</urlset>\n`);
for(const name of ['sitemap_index.xml','sitemap-index.xml','sitemap.xml']) {
 const path=new URL(`public/${name}`,root); let index=await readFile(path,'utf8');
 // Do not submit an empty model sitemap. Add it when the first assignment exists.
 if(routes.length) {
  if(!index.includes('<loc>https://fixup.ge/model-sitemap.xml</loc>')) index=index.replace('</sitemapindex>',`<sitemap><loc>https://fixup.ge/model-sitemap.xml</loc><lastmod>${now}</lastmod></sitemap>\n</sitemapindex>`);
  else if(changed) index=index.replace(/(<loc>https:\/\/fixup\.ge\/model-sitemap\.xml<\/loc>\s*<lastmod>)[^<]+/,`$1${now}`);
 } else index=index.replace(/\s*<sitemap>\s*<loc>https:\/\/fixup\.ge\/model-sitemap\.xml<\/loc>[\s\S]*?<\/sitemap>/g,'');
 await writeFile(path,index);
}
console.log(`[model sitemap] ${routes.length} confirmed model/service/location URLs`);
