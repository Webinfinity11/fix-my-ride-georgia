import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type VipPlan = "vip" | "super_vip";
export type VipPricing = {
  vip_price: number;
  super_vip_price: number;
  vip_discount_percent: number;
  super_vip_discount_percent: number;
  duration_days: number;
  promo_ends_at: string | null;
};

// Used if the price list cannot be loaded: full price, no promotion.
const BASE_PRICING: VipPricing = {
  vip_price: 30, super_vip_price: 50, vip_discount_percent: 50, super_vip_discount_percent: 60, duration_days: 30, promo_ends_at: null,
};

// Local development only: how the promotion will look while none is running.
// A production build never has it.
const DEV_PREVIEW_ENDS = import.meta.env.DEV ? new Date(Date.now() + 24 * 3600e3).toISOString() : null;

export const promoActive = (p: VipPricing, now: number) =>
  !!p.promo_ends_at && Date.parse(p.promo_ends_at) > now;

export function priceFor(p: VipPricing, plan: VipPlan, now: number) {
  const base = plan === "vip" ? p.vip_price : p.super_vip_price;
  const percent = plan === "vip" ? p.vip_discount_percent : p.super_vip_discount_percent;
  const final = promoActive(p, now) ? Math.round((base * (100 - percent)) / 100) : base;
  return { base, final, discounted: final < base, percent };
}

/** "23:59:07" until the promotion ends; never negative. */
export function clock(endsAt: string, now: number) {
  const seconds = Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

/**
 * The price list from the database and a clock that ticks every second.
 * "real" skips the local preview (the admin panel must show the true state).
 */
export function useVipPricing({ real = false } = {}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const query = useQuery({
    queryKey: ["vip-pricing"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("vip_pricing").select("*").single();
      if (error) throw error;
      return data as VipPricing;
    },
  });
  // While loading, callers show no price at all: a full price must not flash
  // for a moment before the promotional one.
  const stored = query.data ?? BASE_PRICING;
  const loading = query.isLoading;
  const preview = !real && !!DEV_PREVIEW_ENDS && !loading && !promoActive(stored, now);
  return { pricing: preview ? { ...stored, promo_ends_at: DEV_PREVIEW_ENDS } : stored, now, loading };
}
