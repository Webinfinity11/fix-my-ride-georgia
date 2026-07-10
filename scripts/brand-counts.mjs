#!/usr/bin/env node
// Phase 0 — brand landing-page feasibility.
// Counts ACTIVE services per car brand (and per brand×city) so we can decide
// which brand pages clear the quality gate. Read-only, anon key (public read).
//
//   Run:  node scripts/brand-counts.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kwozniwtygkdoagjegom.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3b3puaXd0eWdrZG9hZ2plZ29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Mzk3MjIsImV4cCI6MjA2MzQxNTcyMn0.hc51a_SvwYNUWfPmm2D3rriqGmE8LecInNmu5fa3tGk';

const GATE = 5; // ≥ this many active services → brand page qualifies

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// Page through all active services (Supabase caps a single request at 1000).
async function fetchAll() {
  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('mechanic_services')
      .select('id, car_brands, city, category_id')
      .eq('is_active', true)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

const rows = await fetchAll();
console.log(`\nActive services fetched: ${rows.length}`);

const withBrands = rows.filter((r) => Array.isArray(r.car_brands) && r.car_brands.length > 0);
console.log(`Services tagging ≥1 brand: ${withBrands.length} (${Math.round((withBrands.length / rows.length) * 100)}%)\n`);

// Per-brand service count.
const perBrand = new Map();
const perBrandCity = new Map();
for (const r of withBrands) {
  const city = (r.city || '').trim() || '—';
  for (const raw of r.car_brands) {
    const b = (raw || '').trim();
    if (!b) continue;
    perBrand.set(b, (perBrand.get(b) || 0) + 1);
    const key = `${b}||${city}`;
    perBrandCity.set(key, (perBrandCity.get(key) || 0) + 1);
  }
}

const sorted = [...perBrand.entries()].sort((a, b) => b[1] - a[1]);
const qualifying = sorted.filter(([, n]) => n >= GATE);

console.log(`=== Brand distribution (${sorted.length} distinct brands) ===`);
for (const [b, n] of sorted) {
  const mark = n >= GATE ? '✅' : '  ';
  console.log(`${mark} ${String(n).padStart(4)}  ${b}`);
}

console.log(`\n=== QUALIFYING (≥${GATE}): ${qualifying.length} brands → ${qualifying.length} hub pages ===`);
console.log(qualifying.map(([b]) => b).join(', '));

// Brand×city combos that qualify (Phase C preview).
const cityCombos = [...perBrandCity.entries()]
  .map(([k, n]) => [k.split('||'), n])
  .filter(([, n]) => n >= GATE)
  .sort((a, b) => b[1] - a[1]);
console.log(`\n=== Brand×City combos ≥${GATE} (Phase C preview): ${cityCombos.length} ===`);
for (const [[b, c], n] of cityCombos.slice(0, 25)) {
  console.log(`   ${String(n).padStart(4)}  ${b} — ${c}`);
}

// --- Diagnostic: how many brands does each service tag? ---
const hist = new Map();
for (const r of withBrands) {
  const n = r.car_brands.length;
  hist.set(n, (hist.get(n) || 0) + 1);
}
console.log('\n=== brands-per-service histogram (signal check) ===');
for (const [n, c] of [...hist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
  console.log(`   ${String(c).padStart(4)} services tag ${n} brands`);
}
const allOrNearAll = withBrands.filter((r) => r.car_brands.length >= 45).length;
console.log(`\nServices tagging ≥45 of 52 brands ("select-all"): ${allOrNearAll} (${Math.round(allOrNearAll/withBrands.length*100)}%)`);
const specialists = withBrands.filter((r) => r.car_brands.length <= 5).length;
console.log(`Services tagging ≤5 brands (real specialists): ${specialists} (${Math.round(specialists/withBrands.length*100)}%)`);

// --- Signal-only view: count per brand using ONLY specialist services
// (services that tag a focused set of brands, not the select-all noise). ---
for (const SPEC_MAX of [10, 5]) {
  const specialistsRows = withBrands.filter((r) => r.car_brands.length <= SPEC_MAX);
  const perBrandSpec = new Map();
  for (const r of specialistsRows) {
    for (const raw of r.car_brands) {
      const b = (raw || '').trim();
      if (b) perBrandSpec.set(b, (perBrandSpec.get(b) || 0) + 1);
    }
  }
  const q = [...perBrandSpec.entries()].sort((a, b) => b[1] - a[1]).filter(([, n]) => n >= GATE);
  console.log(`\n=== SPECIALIST signal (services tagging ≤${SPEC_MAX} brands): ${specialistsRows.length} rows → ${q.length} brands ≥${GATE} ===`);
  console.log(q.map(([b, n]) => `${b}:${n}`).join('  '));
}
