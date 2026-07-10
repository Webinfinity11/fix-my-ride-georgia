/**
 * Car-brand landing pages (/brand/:slug).
 *
 * IMPORTANT — data-quality gate. Most services tag the "all brands" option, so a
 * naive per-brand count is noise (~400 for every brand, exotic ones included).
 * Real signal comes only from *specialist* services — those tagging a focused
 * set of brands. A service counts as a specialist for brand pages when it tags
 * at most SPECIALIST_MAX brands.
 *
 * BRAND_PAGES is the snapshot of brands that cleared "≥5 specialist services"
 * (see scripts/brand-counts.mjs). Georgia's US-auction market shows here — the
 * list is American-brand heavy. Re-run the script and update this list as the
 * catalogue grows. The page itself ALSO gates on the live specialist count, so
 * a brand that drops below the bar self-noindexes even before this list is
 * refreshed.
 */

/** A service tagging ≤ this many brands is treated as a specialist. */
export const SPECIALIST_MAX = 5;

/** Minimum specialist services for a brand page to be indexable. */
export const BRAND_MIN_SPECIALISTS = 5;

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

export const BRAND_PAGES: BrandInfo[] = [
  { name: 'Ford',          nameKa: 'ფორდი',          nameKaGen: 'ფორდის',          slug: 'ford' },
  { name: 'Toyota',        nameKa: 'ტოიოტა',         nameKaGen: 'ტოიოტას',         slug: 'toyota' },
  { name: 'Lincoln',       nameKa: 'ლინკოლნი',       nameKaGen: 'ლინკოლნის',       slug: 'lincoln' },
  { name: 'Chevrolet',     nameKa: 'შევროლეტი',      nameKaGen: 'შევროლეტის',      slug: 'chevrolet' },
  { name: 'Lexus',         nameKa: 'ლექსუსი',        nameKaGen: 'ლექსუსის',        slug: 'lexus' },
  { name: 'Buick',         nameKa: 'ბიუიკი',         nameKaGen: 'ბიუიკის',         slug: 'buick' },
  { name: 'Cadillac',      nameKa: 'კადილაკი',       nameKaGen: 'კადილაკის',       slug: 'cadillac' },
  { name: 'GMC',           nameKa: 'GMC',            nameKaGen: 'GMC-ის',          slug: 'gmc' },
  { name: 'Opel',          nameKa: 'ოპელი',          nameKaGen: 'ოპელის',          slug: 'opel' },
  { name: 'Tesla',         nameKa: 'ტესლა',          nameKaGen: 'ტესლას',          slug: 'tesla' },
  { name: 'Audi',          nameKa: 'აუდი',           nameKaGen: 'აუდის',           slug: 'audi' },
  { name: 'Volkswagen',    nameKa: 'ფოლკსვაგენი',    nameKaGen: 'ფოლკსვაგენის',    slug: 'volkswagen' },
  { name: 'Mercedes-Benz', nameKa: 'მერსედეს-ბენცი', nameKaGen: 'მერსედეს-ბენცის', slug: 'mercedes-benz' },
  { name: 'Skoda',         nameKa: 'შკოდა',          nameKaGen: 'შკოდას',          slug: 'skoda' },
  { name: 'Kia',           nameKa: 'კია',            nameKaGen: 'კიას',            slug: 'kia' },
  { name: 'Hyundai',       nameKa: 'ჰიუნდაი',        nameKaGen: 'ჰიუნდაის',        slug: 'hyundai' },
];

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
