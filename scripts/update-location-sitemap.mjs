import { readFile,writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { locationRoutes } from './location-routes.mjs';
const root=new URL('../',import.meta.url);
let inventory;
const input=process.argv.indexOf('--input');
if(input>=0) inventory=JSON.parse(await readFile(process.argv[input+1],'utf8'));
else {
  const source=await readFile(new URL('src/integrations/supabase/client.ts',root),'utf8');
  const client=createClient(source.match(/SUPABASE_URL = "([^"]+)"/)[1],source.match(/SUPABASE_PUBLISHABLE_KEY = "([^"]+)"/)[1],{auth:{persistSession:false,autoRefreshToken:false}});
  const services=[];
  for(let offset=0;;offset+=1000){
    const {data,error}=await client.from('mechanic_services').select('city,category_id,mechanic_id').eq('is_active',true).order('id').range(offset,offset+999);
    if(error)throw error;services.push(...data);if(data.length<1000)break;
  }
  const {data:categories,error}=await client.from('service_categories').select('id,name');
  if(error)throw error;
  inventory={services,categories};
}
const routes=locationRoutes(inventory.services,inventory.categories);
const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.indexable.map(path=>`  <url><loc>https://fixup.ge${path}</loc></url>`).join('\n')}\n</urlset>\n`;
await writeFile(new URL('public/city-sitemap.xml',root),xml);
await writeFile(new URL('scripts/location-render-routes.json',root),JSON.stringify(routes.render,null,2)+'\n');
for(const file of ['sitemap_index.xml','sitemap-index.xml','sitemap.xml']){
  const path=new URL(`public/${file}`,root);let index=await readFile(path,'utf8');
  if(!index.includes('https://fixup.ge/city-sitemap.xml'))index=index.replace('</sitemapindex>','  <sitemap><loc>https://fixup.ge/city-sitemap.xml</loc></sitemap>\n</sitemapindex>');
  await writeFile(path,index);
}
console.log(`[locations] ${routes.indexable.length} indexable URLs, ${routes.render.length} route documents (including noindex pages)`);
