import brandPages from '@/data/brand-pages.json';
import brandIndexing from '@/data/brand-indexing.json';
/**
 * Car-brand landing pages (/brand/:slug).
 *
 * IMPORTANT — data-quality gate. Most services tag the "all brands" option, so a
 * naive per-brand count is noise (~400 for every brand, exotic ones included).
 * Real signal comes only from *specialist* services — those tagging a focused
 * set of brands. A service counts as a specialist for brand pages when it tags
 * at most SPECIALIST_MAX brands.
 *
 * The shared catalogue also includes developing brands. Only pages with
 * sufficient focused services enter the index sitemap; all supported hubs
 * are prerendered so their own canonical and index policy reach crawlers.
 */

/** A service tagging ≤ this many brands is treated as a specialist. */
export const SPECIALIST_MAX = brandIndexing.specialistMaxBrands;

/** Minimum specialist services for a brand page to be indexable. */
export const BRAND_MIN_SPECIALISTS = brandIndexing.minimumServices;

export type BrandInfo = {
  /** Canonical name — must match mechanic_services.car_brands values. */
  name: string;
  /** Georgian display name (nominative) for grids / switchers. */
  nameKa: string;
  /** Georgian genitive form ("of {brand}") for H1 / body copy. */
  nameKaGen: string;
  /** URL slug. */
  slug: string;
};

export const BRAND_PAGES: BrandInfo[] = brandPages;

const SLUG_INDEX: Record<string, BrandInfo> = Object.fromEntries(
  BRAND_PAGES.map((b) => [b.slug, b]),
);

export function getBrandBySlug(slug: string | undefined | null): BrandInfo | null {
  if (!slug) return null;
  return SLUG_INDEX[slug.toLowerCase()] || null;
}

/** True when a service's car_brands array marks it as a brand specialist. */
export function isSpecialist(carBrands: string[] | null | undefined): boolean {
  return Array.isArray(carBrands) && carBrands.length > 0 && carBrands.length <= SPECIALIST_MAX;
}

const NAME_INDEX: Record<string, BrandInfo> = Object.fromEntries(
  BRAND_PAGES.map((b) => [b.name, b]),
);

/**
 * Brand pages to link from a specialist service. Empty for "all brands" (select
 * all) services — linking those to every brand page would be spammy, so only
 * genuinely focused services get contextual brand links.
 */
export function brandsForService(carBrands: string[] | null | undefined): BrandInfo[] {
  if (!isSpecialist(carBrands)) return [];
  return (carBrands as string[])
    .map((b) => NAME_INDEX[(b || '').trim()])
    .filter((b): b is BrandInfo => Boolean(b));
}
