// SEO indexability thresholds (Phase 2 — #10/#13/#14/#31/#32).
//
// A page ships in the sitemap AND renders `index, follow` ONLY if it clears
// these bars. Thin pages get `noindex, follow` (crawlable, not indexed) so
// Google spends its crawl budget on quality URLs. Sitemap membership and the
// page's own robots directive MUST agree — that is the core of #10 consistency.
//
// KEEP IN SYNC with scripts/generate-sitemap.mjs (isServiceIndexable /
// isMechanicIndexable). If you change a threshold here, change it there too.
//
// NOTE: thresholds are tuned to fixup.ge's REAL data. As of Phase 2:
//   • verified_at is unpopulated for every mechanic (0/248) — NOT used as a gate,
//     gating on it would deindex the entire mechanic sitemap.
//   • specialization is set for only 7/248 mechanics — NOT used as a gate.
// The dominant real completeness signals are: has a city, has a description,
// or offers at least one active service.

export const MIN_DESCRIPTION_LEN = 20;

export interface ServiceIndexInput {
  is_active?: boolean | null;
  name?: string | null;
  category_id?: number | null;
  category?: { name?: string | null } | null;
  service_categories?: { name?: string | null } | null;
  description?: string | null;
  photos?: string[] | null;
}

/**
 * A service page is indexable when it is active, has a name and a real category,
 * and carries unique content — either a meaningful description or at least one
 * photo. Empty/thin listings (no description AND no photo) are excluded.
 */
export function isServiceIndexable(s: ServiceIndexInput): boolean {
  if (s.is_active === false) return false;
  if (!(s.name || "").trim()) return false;
  const hasCategory =
    s.category_id != null || !!s.category?.name || !!s.service_categories?.name;
  if (!hasCategory) return false;
  const desc = (s.description || "").trim();
  const photoCount = Array.isArray(s.photos) ? s.photos.length : 0;
  if (desc.length < MIN_DESCRIPTION_LEN && photoCount === 0) return false;
  return true;
}

export interface MechanicIndexInput {
  display_id?: number | null;
  first_name?: string | null;
  city?: string | null;
  description?: string | null;
  /** true if the mechanic has ≥1 active service */
  hasActiveService?: boolean;
}

/**
 * A mechanic profile is indexable when it has a public display id, a name, and
 * at least one real completeness signal: a city, a description, or an active
 * service. Bare shells (name only) are excluded until the owner fills them in.
 */
export function isMechanicIndexable(m: MechanicIndexInput): boolean {
  if (m.display_id == null) return false;
  if (!(m.first_name || "").trim()) return false;
  const hasLocation = !!(m.city || "").trim();
  const hasDescription = !!(m.description || "").trim();
  return hasLocation || hasDescription || !!m.hasActiveService;
}
