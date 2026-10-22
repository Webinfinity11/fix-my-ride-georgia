// Refresh canonical public catalogue URLs without administrative credentials.
import {readFile,writeFile,readdir,unlink} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {catalogueRoutes,mechanicRoutes,serviceAliases,mechanicAliases} from './catalogue-routes.mjs';
import {servicePath} from './service-prerender.mjs';
import {categorySlug} from './model-routes.mjs';
const root=new URL('../',import.meta.url);
const source=await readFile(new URL('src/integrations/supabase/client.ts',root),'utf8');
const url=source.match(/SUPABASE_URL = "([^"]+)"/)?.[1];
const key=source.match(/SUPABASE_PUBLISHABLE_KEY = "([^"]+)"/)?.[1];
if(!url || !key) throw new Error('Public client configuration unavailable');
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const services=[];
for(let from=0;;from+=1000) {
 const {data,error}=await client.from('mechanic_services').select('id,name,description,photos,category_id,district,updated_at,slug,mechanic_id').eq('is_active',true).order('id').range(from,from+999);
 if(error) throw error;services.push(...data);if(data.length<1000) break;
}
const {data:categories,error}=await client.from('service_categories').select('id,name');
if(error) throw error;
const routes=catalogueRoutes(services,categories || []);
const {data:profiles,error:profileError}=await client.from('profiles').select('id,first_name,last_name,city,mechanic_profiles!inner(display_id,description)').eq('role','mechanic').range(0,4999);
if(profileError) throw profileError;
routes.mechanics=mechanicRoutes(services,profiles || []);
const now=new Date().toISOString();
const aliases=new Map([...serviceAliases(services,categories || []),...mechanicAliases(routes.mechanics)].map(alias=>[alias.path,alias.target]));
const reviewMechanics=[];
const reviewed=JSON.parse(await readFile(new URL('scripts/indexing-review-urls.json',root),'utf8'));
for(const address of reviewed) {
 const parsed=new URL(address);if(parsed.origin!=='https://fixup.ge') continue;
 const serviceMatch=parsed.pathname.match(/^\/service\/(\d+)(?:-[a-z0-9-]+)?$/);
 if(serviceMatch) {
  const service=services.find(s=>s.id===Number(serviceMatch[1]));
  if(service && servicePath(service)!==parsed.pathname) aliases.set(parsed.pathname,servicePath(service));
 }
 const mechanicMatch=parsed.pathname.match(/^\/mechanic\/(\d+)(?:-[a-z0-9-]+)?$/);
 if(mechanicMatch) {
  const profile=(profiles || []).find(p=>p.mechanic_profiles?.display_id===Number(mechanicMatch[1]));
  if(profile?.first_name?.trim()) {
   const target=`/mechanic/${profile.mechanic_profiles.display_id}-${categorySlug(`${profile.first_name} ${profile.last_name}`)}`;
   reviewMechanics.push(target);if(parsed.pathname!==target)aliases.set(parsed.pathname,target);
  }
 }
}
await writeFile(new URL('scripts/catalogue-aliases.json',root),JSON.stringify([...aliases].map(([path,target])=>({path,target})),null,2)+'\n');

await writeFile(new URL('scripts/review-mechanic-routes.json',root),JSON.stringify([...new Set(reviewMechanics)],null,2)+'\n');
const escape=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const byPath=new Map(services.map(s=>[servicePath(s),s]));
const oldIndex=await readFile(new URL("public/sitemap_index.xml",root),"utf8");
const previousDates=new Map([...oldIndex.matchAll(/<loc>https:\/\/fixup\.ge\/([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map(m=>[m[1],m[2]]));
const references=[];
for(const kind of ['service','category','mechanic']) {
 const paths=routes[kind==='service'?'services':kind==='mechanic'?'mechanics':'categories'];
 const names=[];
 for(let offset=0;offset<paths.length;offset+=2000) {
  const chunk=offset/2000;const name=`${kind}-sitemap${chunk || ''}.xml`;names.push(name);
  const file=new URL(`public/${name}`,root);const previous=await readFile(file,'utf8').catch(()=>null);
  const previousDate=previous?.match(/<lastmod>(.*?)<\/lastmod>/)?.[1] || now;
  const previousLocs=[...(previous || '').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
  const locs=paths.slice(offset,offset+2000).map(path=>`https://fixup.ge${path}`);
  const changed=JSON.stringify(locs)!==JSON.stringify(previousLocs);
  const entries=paths.slice(offset,offset+2000).map(path=>{
   const service=byPath.get(path);const updated=service?.updated_at ? new Date(service.updated_at).toISOString() : changed ? now : previousDate;
   const images=(service?.photos || []).filter(p=>typeof p==='string'&&p.startsWith('http')).slice(0,5).map(p=>`<image:image><image:loc>${escape(p)}</image:loc></image:image>`).join('');
   return `  <url><loc>https://fixup.ge${path}</loc><lastmod>${updated}</lastmod>${images}</url>`;
  });
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="//fixup.ge/main-sitemap.xsl"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${entries.join('\n')}\n</urlset>\n`;
  if(xml!==previous) await writeFile(file,xml);
  references.push(`<sitemap><loc>https://fixup.ge/${name}</loc><lastmod>${xml!==previous ? now : previousDates.get(name) || now}</lastmod></sitemap>`);
 }
 for(const name of await readdir(new URL('public/',root))) if(new RegExp(`^${kind}-sitemap\\d*\\.xml$`).test(name)&&!names.includes(name)) await unlink(new URL(`public/${name}`,root));
}
for(const name of ['sitemap_index.xml','sitemap-index.xml','sitemap.xml']) {
 const file=new URL(`public/${name}`,root);let xml=await readFile(file,'utf8');
 xml=xml.replace(/\s*<sitemap>\s*<loc>https:\/\/fixup\.ge\/(?:service|category|mechanic)-sitemap\d*\.xml<\/loc>[\s\S]*?<\/sitemap>/g,'');
 xml=xml.replace('</sitemapindex>',`${references.join('\n')}\n</sitemapindex>`);await writeFile(file,xml);
}
// Legacy video URLs must point at the same canonical service documents.
const videoFile=new URL('public/video-sitemap.xml',root);
const video=await readFile(videoFile,'utf8').catch(()=>null);
if(video) {
 const byId=new Map(services.map(s=>[String(s.id),servicePath(s)]));
 const corrected=video.replace(/https:\/\/fixup\.ge\/service\/(\d+)[^"<\s]*/g,(match,id)=>byId.has(id)?`https://fixup.ge${byId.get(id)}`:match);
 if(corrected!==video) {
  await writeFile(videoFile,corrected);
  const indexFile=new URL('public/sitemap_index.xml',root);
  const index=await readFile(indexFile,'utf8');
  await writeFile(indexFile,index.replace(/(<loc>https:\/\/fixup\.ge\/video-sitemap\.xml<\/loc>\s*<lastmod>)[^<]+/,`$1${now}`));
 }

}
console.log(`[catalogue sitemap] ${routes.services.length} canonical services; ${routes.categories.length} nonempty category/district URLs; ${routes.mechanics.length} public mechanic URLs`);
