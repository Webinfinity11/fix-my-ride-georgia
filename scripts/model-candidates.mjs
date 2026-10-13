// Read-only inventory. Never applies extracted candidates to the database.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {loadModelHelpers} from './model-test-utils.mjs';
const {candidateModels}=loadModelHelpers();
const root=new URL('../',import.meta.url);
const source=await readFile(new URL('src/integrations/supabase/client.ts',root),'utf8');
const url=source.match(/SUPABASE_URL = "([^"]+)"/)?.[1];
const key=source.match(/SUPABASE_PUBLISHABLE_KEY = "([^"]+)"/)?.[1];
const brands=JSON.parse(await readFile(new URL('src/data/brand-pages.json',root),'utf8'));
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const {data,error}=await client.from('mechanic_services').select('id,name,description,car_brands,category_id,district').eq('is_active',true).range(0,4999);
if(error) throw error;
const rows=[];
for(const service of data || []) {
 const candidates=candidateModels(service.name,service.description || '',service.car_brands || []);
 if(!candidates.length) continue;
 const titleModels=candidateModels(service.name,'',service.car_brands || []).filter(model=>{
  const brand=brands.find(b=>b.name===model.brand);
  const title=service.name.toLowerCase();
  return title.includes(model.brand.toLowerCase()) || (brand && title.includes(brand.nameKa.replace(/ი$/,'').toLowerCase()));
 });
 rows.push({service_id:service.id,title:service.name,category_id:service.category_id,district:service.district,candidates,titleModels});
}
await mkdir(new URL('scripts/reports/',root),{recursive:true});
await writeFile(new URL('scripts/reports/model-candidates.json',root),JSON.stringify({generated_at:new Date().toISOString(),requires_review:true,rows},null,2)+'\n');
console.log(JSON.stringify({candidate_services:rows.length,explicit_title_services:rows.filter(r=>r.titleModels.length).length}));
console.log(JSON.stringify(rows.filter(r=>r.titleModels.length).map(r=>({id:r.service_id,title:r.title,models:r.titleModels})),null,2));
