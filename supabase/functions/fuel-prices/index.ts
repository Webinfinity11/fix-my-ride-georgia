import { loadFuelCatalogue } from "../_shared/fuel-catalogue.ts";
import { fetchPricesHub } from "../_shared/priceshub.ts";
// PricesHub company tables are the primary source. The legacy per-company
// scraper is only a cold-start fallback. A complete PricesHub cache is retained
// when that source fails, rather than replaced by a partial catalogue.
// The database migration installs the daily job and atomic cache/history RPC.
// Existing 6h stale-while-refresh behavior also lets visitors refresh old data.
// ?refresh=true requests a synchronous refresh; failed refreshes keep the cache.

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
async function scrapeFallback() {
  const results = await Promise.allSettled(COMPANIES.map((c) => fetchCompany(c)));
  const companies = results
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchCompany>>> =>
      r.status === "fulfilled" && !!r.value
    )
    .map((r) => r.value);
  return { companies, fetchedAt: new Date().toISOString(), source: "upstream-fallback" };
}

async function scrapeAll(previous?: { source?: string }) {
  return await loadFuelCatalogue(previous, fetchPricesHub, scrapeFallback);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const force = new URL(req.url).searchParams.get("refresh") === "true";

  const store = async (payload: unknown) => {
    const { error } = await supabase.rpc('store_fuel_prices_snapshot', { payload });
    if (error) throw new Error(`Fuel cache/history write failed: ${error.message}`);
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
      let payload;
      try { payload = await scrapeAll(row?.data); }
      catch (error) {
        if (row) return json({ success: true, cached: true, stale: true, refreshFailed: true, updated_at: row.updated_at, data: row.data });
        throw error;
      }
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
        const payload = await scrapeAll(row.data);
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
