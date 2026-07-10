import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { DISTRICTS } from '@/utils/districts';
import { SPECIALIST_MAX, BRAND_MIN_SPECIALISTS, type BrandInfo } from '@/utils/carBrands';

/**
 * Internal-link grid pointing to the brand's per-district pages
 * (/brand/:slug/:district). Mirrors DistrictsNav but gates on the count of
 * *specialist* services (≤ SPECIALIST_MAX brands) for this brand in each
 * district — so it never links to a page that would fall below the index gate.
 *
 * On the brand hub it offers every qualifying district; on a district page it
 * offers the siblings (current district excluded).
 */
export function BrandDistrictsNav({ brand, currentDistrictSlug }: {
  brand: BrandInfo;
  currentDistrictSlug?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['brand-district-specialists', brand.name],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mechanic_services')
        .select('district, car_brands')
        .overlaps('car_brands', [brand.name])
        .eq('is_active', true)
        .not('district', 'is', null);
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of (data || []) as Array<{ district: string | null; car_brands: string[] | null }>) {
        const brands = Array.isArray(row.car_brands) ? row.car_brands : [];
        // Specialist for this brand only — keeps counts aligned with the page gate.
        if (brands.length === 0 || brands.length > SPECIALIST_MAX) continue;
        const name = (row.district || '').trim();
        if (name) counts.set(name, (counts.get(name) || 0) + 1);
      }
      return DISTRICTS
        .map((d) => ({ ...d, count: counts.get(d.name) || 0 }))
        .filter((d) => d.count >= BRAND_MIN_SPECIALISTS);
    },
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading || !data) return null;
  const districts = data.filter((d) => d.slug !== currentDistrictSlug);
  if (districts.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          {brand.nameKaGen} ხელოსანი თბილისის უბნებში
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {districts.map((d) => (
            <Link key={d.slug} to={`/brand/${brand.slug}/${d.slug}`} className="block">
              <Card className="p-3 hover:shadow-md transition-shadow hover:border-primary">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm md:text-base line-clamp-1">
                    {brand.nameKa} {d.nameLocative}
                  </span>
                  <span className="flex-shrink-0 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {d.count}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
