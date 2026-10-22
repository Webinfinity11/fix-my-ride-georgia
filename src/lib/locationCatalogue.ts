import { supabase } from '@/integrations/supabase/client';
export const locationCatalogueOptions = {
  queryKey: ['location-catalogue-inventory', 'brands-v2'], staleTime: 60_000, retry: false,
  queryFn: async () => {
    const rows: { city: string | null; category_id: number | null; mechanic_id: string; car_brands: string[] | null }[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from('mechanic_services').select('city,category_id,mechanic_id,car_brands').eq('is_active', true).order('id').range(offset, offset + 999);
      if (error) throw error;
      rows.push(...data);
      if (data.length < 1000) break;
    }
    return rows;
  },
};
