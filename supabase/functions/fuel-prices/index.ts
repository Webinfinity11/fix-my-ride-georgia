// Platform-wide fuel-price cache.
//
// The upstream backend (fuel-prices-backend.onrender.com) runs in scrape-only
// mode: every request live-scrapes the source sites (2–11s per company, no
// server cache). Instead of making every browser pay that cost on its first
// visit, this function scrapes ALL companies once, stores the result in
// public.fuel_prices_cache, and serves that cached row to everyone.
//
// Behaviour:
//   • fresh cache (< 6h)            → return it immediately (~200ms)
//   • stale cache (>= 6h)           → return the stale copy immediately AND
//                                      refresh in the background (no user waits)
//   • no cache yet (first ever)     → scrape synchronously, store, return
//   • ?refresh=true                 → force a synchronous scrape (manual/debug)
//
// A cron (see config.toml, every 6h) hits this function to keep the cache warm,
// so in practice no end user ever waits for a live scrape.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const BACKEND = "https://fuel-prices-backend.onrender.com";
// NOTE: "connect" is intentionally excluded — its scraper is broken upstream.
const COMPANIES = ["wissol", "portal", "socar", "gulf", "rompetrol"];
const PER_COMPANY_TIMEOUT_MS = 25_000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function fetchCompany(company: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), PER_COMPANY_TIMEOUT_MS);
  try {
    const res = await fetch(`${BACKEND}/api/fuel-prices/${company}?english=true`, {
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`${company}: HTTP ${res.status}`);
    const j = await res.json();
    if (!j?.success || !j?.data) throw new Error(`${company}: unsuccessful response`);
    return {
      name: j.data.company,
      fuelPrices: j.data.fuelPrices,
      totalFuelTypes: j.data.totalFuelTypes,
      priceRange: j.data.priceRange,
      timestamp: j.timestamp,
    };
  } finally {
    clearTimeout(t);
  }
}

// Scrape every company (best-effort) and build the payload we cache.
async function scrapeAll() {
  const results = await Promise.allSettled(COMPANIES.map((c) => fetchCompany(c)));
  const companies = results
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchCompany>>> =>
      r.status === "fulfilled" && !!r.value
    )
    .map((r) => r.value);
  return { companies, fetchedAt: new Date().toISOString() };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const force = new URL(req.url).searchParams.get("refresh") === "true";

  const store = async (payload: unknown) => {
    await supabase
      .from("fuel_prices_cache")
      .upsert({ id: 1, data: payload, updated_at: new Date().toISOString() });
  };

  try {
    const { data: row } = await supabase
      .from("fuel_prices_cache")
      .select("data, updated_at")
      .eq("id", 1)
      .maybeSingle();

    const ageMs = row ? Date.now() - new Date(row.updated_at).getTime() : Infinity;
    const isFresh = row && ageMs < TTL_MS;

    // Serve fresh cache as-is.
    if (isFresh && !force) {
      return json({ success: true, cached: true, updated_at: row!.updated_at, data: row!.data });
    }

    // Forced refresh, or no cache at all → scrape synchronously.
    if (force || !row) {
      const payload = await scrapeAll();
      if (payload.companies.length === 0) {
        // Scrape failed — fall back to whatever we had (even if stale).
        if (row) {
          return json({ success: true, cached: true, stale: true, updated_at: row.updated_at, data: row.data });
        }
        return json({ success: false, error: "Failed to fetch fuel prices" }, 502);
      }
      await store(payload);
      return json({ success: true, cached: false, updated_at: new Date().toISOString(), data: payload });
    }

    // Stale cache exists → return it NOW, refresh in the background so no one waits.
    const bg = (async () => {
      try {
        const payload = await scrapeAll();
        if (payload.companies.length > 0) await store(payload);
      } catch (e) {
        console.error("[fuel-prices] background refresh failed:", e);
      }
    })();
    // deno-lint-ignore no-explicit-any
    const rt = (globalThis as any).EdgeRuntime;
    if (rt?.waitUntil) rt.waitUntil(bg);

    return json({ success: true, cached: true, stale: true, refreshing: true, updated_at: row.updated_at, data: row.data });
  } catch (e) {
    console.error("[fuel-prices] error:", e);
    return json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
