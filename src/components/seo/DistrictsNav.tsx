import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { DISTRICTS } from '@/utils/districts';

/**
 * Internal-link grid pointing visitors to the district-specific sub-pages.
 *
 * Renders only the districts where this category actually has services, with
 * the live count. Empty districts are hidden so the grid doesn't link to
 * pages that would say "0 services" — both bad UX and bad SEO.
 */
export function DistrictsNav({
  categoryId,
  categorySlug,
  categoryName,
  currentDistrictSlug,
}: {
  categoryId: number;
  categorySlug: string;
  categoryName: string;
  currentDistrictSlug?: string;
}) {
  const { data: districtCounts, isLoading } = useQuery({
    queryKey: ['category-district-counts', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mechanic_services')
        .select('district')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .not('district', 'is', null);
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of (data || []) as Array<{ district: string }>) {
        if (row.district) counts.set(row.district, (counts.get(row.district) || 0) + 1);
      }
      return counts;
    },
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading || !districtCounts) return null;

  const visible = DISTRICTS
    .map((d) => ({ ...d, count: districtCounts.get(d.name) || 0 }))
    .filter((d) => d.count > 0 && d.slug !== currentDistrictSlug);

  if (visible.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          {categoryName} თბილისის უბნებში
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {visible.map((d) => (
            <Link
              key={d.slug}
              to={`/category/${categorySlug}/${d.slug}`}
              className="block"
            >
              <Card className="p-3 hover:shadow-md transition-shadow hover:border-primary">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm md:text-base line-clamp-1">
                    {categoryName} {d.nameLocative}
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
