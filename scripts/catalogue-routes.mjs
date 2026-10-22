import { readFileSync } from 'node:fs';
import { categorySlug } from './model-routes.mjs';
import { servicePath } from './service-prerender.mjs';
const districts = new Map([...readFileSync(new URL('../src/utils/districts.ts',import.meta.url),'utf8').matchAll(/slug:\s*'([^']+)',\s*name:\s*'([^']+)'/g)].map(m=>[m[2],m[1]]));
export function serviceIndexable(service) {
 return service.is_active !== false && Boolean(service.name?.trim()) && service.category_id != null && ((service.description?.trim().length || 0) >= 20 || (Array.isArray(service.photos) && service.photos.length > 0));
}
export function catalogueRoutes(services,categories) {
 const active=services.filter(s=>s.is_active!==false);
 const paths=new Set();
 for(const category of categories) {
  const rows=active.filter(s=>s.category_id===category.id);
  if(!rows.length) continue;
  const path=`/category/${categorySlug(category.name)}`;
  paths.add(path);
  for(const row of rows) { const district=districts.get(row.district); if(district) paths.add(`${path}/${district}`); }
 }
 return {categories:[...paths].sort(),services:active.filter(serviceIndexable).map(servicePath).sort()};
}
export function mechanicRoutes(services,profiles) {
 const activeOwners=new Set(services.filter(s=>s.is_active!==false).map(s=>s.mechanic_id));
 return profiles.flatMap(profile=>{
  const info=Array.isArray(profile.mechanic_profiles)?profile.mechanic_profiles[0]:profile.mechanic_profiles;
  if(!info?.display_id || !profile.first_name?.trim() || !(profile.city?.trim() || info.description?.trim() || activeOwners.has(profile.id))) return [];
  return [`/mechanic/${info.display_id}-${categorySlug(`${profile.first_name} ${profile.last_name}`)}`];
 }).sort();
}
export function serviceAliases(services,categories=[]) {
 const active=services.filter(s=>s.is_active!==false && s.name?.trim());
 const canonical=new Set(active.map(servicePath));
 const candidates=new Map();
 const add=(path,target)=>{if(path===target || canonical.has(path))return;if(!candidates.has(path))candidates.set(path,new Set());candidates.get(path).add(target);};
 for(const service of active) {
  const target=servicePath(service);add(`/service/${service.id}`,target);
  if(service.slug && /^[a-z0-9][a-z0-9-]*$/.test(service.slug)) {
   const idPrefix=service.slug.match(/^(\d+)-/);
   if(idPrefix) {if(Number(idPrefix[1])===service.id)add(`/service/${service.slug}`,target);}
   else {if(!/^\d+$/.test(service.slug))add(`/service/${service.slug}`,target);add(`/service/${service.id}-${service.slug}`,target);}
  }
 }
 return [...candidates].flatMap(([path,targets])=>{
  if(targets.size===1) return [{path,target:[...targets][0]}];
  const ids=[...targets].map(target=>Number(target.match(/\/service\/(\d+)/)?.[1]));
  const categoryIds=new Set(active.filter(service=>ids.includes(service.id)).map(service=>service.category_id));
  const category=categoryIds.size===1 ? categories.find(c=>c.id===[...categoryIds][0]) : null;
  return category ? [{path,target:`/category/${categorySlug(category.name)}`}] : [];
 }).sort((a,b)=>a.path.localeCompare(b.path));
}

export function mechanicAliases(paths) {
 return paths.flatMap(target=>{
  const match=target.match(/^\/mechanic\/(\d+)-(.+)$/);
  return match ? [{path:`/mechanic/${match[1]}`,target},{path:`/mechanic/${match[1]}-${match[1]}-${match[2]}`,target}] : [];
 });
}
