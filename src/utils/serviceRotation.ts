/** One seed per tab session, including reloads and native catalogue navigation. */
let fallbackSeed: string | undefined;
export function serviceRotationSeed(): string {
  if (typeof window === 'undefined' || window.__fixupPrerenderCapture) return 'catalogue-prerender';
  try {
    const existing = sessionStorage.getItem('fixup-service-rotation');
    if (existing) return existing;
    const seed = crypto.randomUUID();
    sessionStorage.setItem('fixup-service-rotation', seed);
    return seed;
  } catch {
    return fallbackSeed ??= Math.random().toString(36).slice(2);
  }
}
function hash(value: string): number {
  let result = 2166136261;
  for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
  result = Math.imul(result ^ (result >>> 16), 0x85ebca6b);
  result = Math.imul(result ^ (result >>> 13), 0xc2b2ae35);
  return (result ^ (result >>> 16)) >>> 0;
}
export type RotationRow = { id: number; mechanic_id: string | null; is_vip_active?: boolean; vip_status?: string | null; vip_until?: string | null };
/** Round robin providers within existing paid tiers; never group unrelated hidden profiles. */
export function rotateServiceIds(rows: readonly RotationRow[], seed: string, now = Date.now()): number[] {
  const tiers = [new Map<string, RotationRow[]>(), new Map<string, RotationRow[]>(), new Map<string, RotationRow[]>()];
  for (const row of rows) {
    const vip = row.is_vip_active && (!row.vip_until || Date.parse(row.vip_until) > now);
    const tier = vip ? row.vip_status === 'super_vip' ? 0 : 1 : 2;
    const provider = row.mechanic_id || `service:${row.id}`;
    const group = tiers[tier].get(provider) ?? [];
    group.push(row);
    tiers[tier].set(provider, group);
  }
  const result: number[] = [];
  for (const groups of tiers) {
    const providers = [...groups.keys()].sort((a, b) => hash(`${seed}:${a}`) - hash(`${seed}:${b}`) || a.localeCompare(b));
    for (const group of groups.values()) group.sort((a, b) => hash(`${seed}:service:${a.id}`) - hash(`${seed}:service:${b.id}`) || a.id - b.id);
    for (let round = 0; ; round++) {
      let added = false;
      for (const provider of providers) {
        const row = groups.get(provider)![round];
        if (row) { result.push(row.id); added = true; }
      }
      if (!added) break;
    }
  }
  return result;
}

/** Freeze a filtered list for pagination/reloads; later additions join next session. */
export function sessionServiceIds(scope: string, create: () => Promise<number[]>): Promise<number[]> {
  const key = `fixup-rotation-list:${scope}`;
  if (typeof window !== 'undefined' && !window.__fixupPrerenderCapture) {
    try {
      const stored = JSON.parse(sessionStorage.getItem(key) ?? 'null');
      if (Array.isArray(stored) && stored.every(id => Number.isSafeInteger(id))) return Promise.resolve(stored);
    } catch { /* Storage may be unavailable; deterministic seed still stabilizes ordering. */ }
  }
  return create().then(ids => {
    if (typeof window !== 'undefined' && !window.__fixupPrerenderCapture) {
      try { sessionStorage.setItem(key, JSON.stringify(ids)); } catch { /* Best effort on restricted browsers. */ }
    }
    return ids;
  });
}
