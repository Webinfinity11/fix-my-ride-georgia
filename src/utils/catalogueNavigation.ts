import { BRAND_PAGES } from '@/utils/carBrands';
import { locationPath } from '@/utils/locationCatalogue';

export function readBrandQuery(params: URLSearchParams): string[] {
  const supported = new Set(BRAND_PAGES.map(brand => brand.name));
  return [...new Set((params.get('brands') || '').split(',').filter(name => supported.has(name)))];
}

export function withBrandQuery(path: string, brands: string[]): string {
  const selected = [...new Set(brands)].sort();
  return selected.length ? `${path}?${new URLSearchParams({ brands: selected.join(',') })}` : path;
}

// Canonical category/city routes remain primary; supplemental brands use a query.
export function cataloguePath({ categorySlug, citySlug, brands = [] }: { categorySlug?: string; citySlug?: string; brands?: string[] }): string {
  if (categorySlug) return withBrandQuery(citySlug ? locationPath(citySlug, categorySlug) : `/category/${categorySlug}`, brands);
  if (citySlug) return withBrandQuery(locationPath(citySlug), brands);
  const brand = brands.length === 1 ? BRAND_PAGES.find(item => item.name === brands[0]) : undefined;
  return brand ? `/brand/${brand.slug}` : withBrandQuery('/services', brands);
}
