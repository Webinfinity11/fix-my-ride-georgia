import { readFileSync } from 'node:fs';
const root=new URL('../',import.meta.url);
const brands=JSON.parse(readFileSync(new URL('src/data/brand-pages.json',root),'utf8'));
const districtSource=readFileSync(new URL('src/utils/districts.ts',root),'utf8');
const districts=new Map([...districtSource.matchAll(/slug:\s*'([^']+)',\s*name:\s*'([^']+)'/g)].map(([,slug,name])=>[name,slug]));
const alphabet={'ა':'a','ბ':'b','გ':'g','დ':'d','ე':'e','ვ':'v','ზ':'z','თ':'t','ი':'i','კ':'k','ლ':'l','მ':'m','ნ':'n','ო':'o','პ':'p','ჟ':'zh','რ':'r','ს':'s','ტ':'t','უ':'u','ფ':'p','ქ':'q','ღ':'gh','ყ':'q','შ':'sh','ჩ':'ch','ც':'ts','ძ':'dz','წ':'ts','ჭ':'ch','ხ':'kh','ჯ':'j','ჰ':'h'};
export const categorySlug=name=>name.toLowerCase().split('').map(c=>alphabet[c]||c).join('').replace(/[^\w\s-]/g,'').replace(/[\s_]+/g,'-').replace(/-+/g,'-').replace(/^-+|-+$/g,'');
export function modelRoutes(services,categories) {
 const paths=new Set();
 for(const service of services) {
  if(service.is_active===false || !Array.isArray(service.vehicle_models)) continue;
  for(const model of service.vehicle_models) {
   const brand=brands.find(b=>b.name===model.brand);
   if(!brand || !(service.car_brands || []).includes(model.brand) || !/^[a-z0-9]{1,64}$/.test(model.slug || '')) continue;
   const path=`/brand/${brand.slug}/model/${model.slug}`;
   paths.add(path);
   const category=categories.find(c=>c.id===service.category_id);
   if(category) {
    const categoryPath=`${path}/service/${categorySlug(category.name)}`;
    paths.add(categoryPath);
    const district=districts.get(service.district);
    if(district) paths.add(`${categoryPath}/district/${district}`);
   }
  }
 }
 return [...paths].sort();
}
