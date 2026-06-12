/**
 * Tbilisi districts supported for landing pages (/category/:slug/:district).
 *
 * Only districts with ≥10 active services qualify — anything thinner produces
 * a near-empty landing page that hurts SEO. Snapshot from the mechanic_services
 * table at the time the feature shipped:
 *
 *   დიღომი 78, გლდანი 77, ვარკეთილი 69, დიდუბე 46, საბურთალო 44,
 *   ნაძალადევი 34, სამგორი 32, ისანი 25, ჩუღურეთი 11
 *
 * Each entry pairs the URL slug with the canonical Georgian name (used to
 * filter mechanic_services.district) and the locative form (used in H1 +
 * meta description so the page reads naturally: "გლდანში" not "გლდანი").
 */

export type DistrictInfo = {
  /** URL slug (latinised). */
  slug: string;
  /** Canonical nominative form. Must match mechanic_services.district. */
  name: string;
  /** "in {district}" form for H1/meta sentences. */
  nameLocative: string;
};

export const DISTRICTS: DistrictInfo[] = [
  { slug: 'gldani',      name: 'გლდანი',      nameLocative: 'გლდანში' },
  { slug: 'varketili',   name: 'ვარკეთილი',   nameLocative: 'ვარკეთილში' },
  { slug: 'digomi',      name: 'დიღომი',      nameLocative: 'დიღომში' },
  { slug: 'didube',      name: 'დიდუბე',      nameLocative: 'დიდუბეში' },
  { slug: 'saburtalo',   name: 'საბურთალო',   nameLocative: 'საბურთალოზე' },
  { slug: 'nadzaladevi', name: 'ნაძალადევი',  nameLocative: 'ნაძალადევში' },
  { slug: 'samgori',     name: 'სამგორი',     nameLocative: 'სამგორში' },
  { slug: 'isani',       name: 'ისანი',       nameLocative: 'ისანში' },
  { slug: 'chughureti',  name: 'ჩუღურეთი',    nameLocative: 'ჩუღურეთში' },
];

const SLUG_INDEX: Record<string, DistrictInfo> = Object.fromEntries(
  DISTRICTS.map((d) => [d.slug, d])
);

export function getDistrictBySlug(slug: string | undefined | null): DistrictInfo | null {
  if (!slug) return null;
  return SLUG_INDEX[slug.toLowerCase()] || null;
}
