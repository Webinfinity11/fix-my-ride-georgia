import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getPublicServiceCategories } from '@/lib/serviceMetadata';
import { createCategorySlug } from '@/utils/slugUtils';
import { DISTRICTS } from '@/utils/districts';
import { normalizeModels, modelPath } from '@/utils/serviceModels';
import type { BrandInfo } from '@/utils/carBrands';
export function ModelLinks({brand,currentPath}: {brand:BrandInfo;currentPath?:string}) {
  const {data:links} = useQuery({
    queryKey:['brand-model-links',brand.name],
    queryFn:async()=>{
      const [{data,error},categories]=await Promise.all([
        supabase.from('mechanic_services').select('vehicle_models,category_id,district').eq('is_active',true).overlaps('car_brands',[brand.name]).range(0,4999),
        getPublicServiceCategories(),
      ]);
      if(error) throw error;
      const paths = new Map<string,string>();
      for(const service of data || []) for(const model of normalizeModels(service.vehicle_models)) {
        if(model.brand!==brand.name) continue;
        const category=categories.find(c=>c.id===service.category_id);
        const district= DISTRICTS.find(d=>d.name===service.district);
        paths.set(modelPath(brand.slug,model.slug),`${brand.nameKa} ${model.model}`);
        if(category) {
          const slug=createCategorySlug(category.name);
          paths.set(modelPath(brand.slug,model.slug,slug),`${model.model} — ${category.name}`);
          if(district) paths.set(modelPath(brand.slug,model.slug,slug,district.slug),`${model.model} — ${category.name} ${district.nameLocative}`);
        }
      }
      return [...paths].map(([path,label])=>({path,label}));
    },staleTime:1000*60*5,
  });
  const visible=links?.filter(l=>l.path!==currentPath);
  if(!visible?.length) return null;
  return <section className="space-y-3"><h2 className="text-xl font-bold">{brand.nameKaGen} მოდელები და მომსახურებები</h2><div className="flex flex-wrap gap-2">{visible.map(l=><Link key={l.path} className="rounded-lg border bg-background px-3 py-2 text-primary hover:bg-muted" to={l.path}>{l.label}</Link>)}</div></section>;
}
