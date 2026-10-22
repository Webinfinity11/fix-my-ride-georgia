import { readFileSync } from 'node:fs';
import { categorySlug } from './model-routes.mjs';
const cities=JSON.parse(readFileSync(new URL('../src/data/cities.json',import.meta.url),'utf8'));
const policy=JSON.parse(readFileSync(new URL('../src/data/location-indexing.json',import.meta.url),'utf8'));
export function locationRoutes(services,categories) {
  const render=new Set(),indexable=new Set();
  const eligible=rows=>rows.length>=policy.minimumServices && new Set(rows.map(row=>row.mechanic_id).filter(Boolean)).size>=policy.minimumProviders;
  for(const city of cities) {
    const rows=services.filter(row=>row.is_active!==false && row.city?.trim()===city.name);
    if(!rows.length) continue;
    const root=`/city/${city.slug}`;
    render.add(root);if(eligible(rows))indexable.add(root);
    for(const category of categories) {
      const matching=rows.filter(row=>row.category_id===category.id);
      if(!matching.length)continue;
      const path=`/category/${categorySlug(category.name)}/city/${city.slug}`;
      render.add(path);if(eligible(matching))indexable.add(path);
    }
  }
  return {render:[...render].sort(),indexable:[...indexable].sort()};
}
