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

// Shown until the price list loads (and if it cannot): full price, no promotion.
export const BASE_PRICING: VipPricing = {
  vip_price: 30, super_vip_price: 50, vip_discount_percent: 50, super_vip_discount_percent: 60, duration_days: 30, promo_ends_at: null,
};

// Local development only, and only while the price table does not exist yet:
// shows how the promotion looks. A production build never uses it.
const DEV_PREVIEW: VipPricing | null = import.meta.env.DEV
  ? { ...BASE_PRICING, promo_ends_at: new Date(Date.now() + 24 * 3600e3).toISOString() }
  : null;

export const promoActive = (p: VipPricing, now: number) =>
  !!p.promo_ends_at && Date.parse(p.promo_ends_at) > now;

export function priceFor(p: VipPricing, plan: VipPlan, now: number) {
  const base = plan === "vip" ? p.vip_price : p.super_vip_price;
  const percent = plan === "vip" ? p.vip_discount_percent : p.super_vip_discount_percent;
  const final = promoActive(p, now) ? Math.round((base * (100 - percent)) / 100) : base;
  return { base, final, discounted: final < base, percent };
}

export function timeLeft(endsAt: string, now: number) {
  const minutes = Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days} დღე ${hours} სთ`;
  if (hours > 0) return `${hours} სთ ${minutes % 60} წთ`;
  return `${minutes} წთ`;
}

/** "23:59:07" until the promotion ends; never negative. */
export function clock(endsAt: string, now: number) {
  const seconds = Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

export function useVipPricing() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const query = useQuery({
    queryKey: ["vip-pricing"],
    staleTime: 60_000,
    retry: import.meta.env.DEV ? false : 3,
    queryFn: async () => {
      const { data, error } = await supabase.from("vip_pricing").select("*").single();
      if (error) throw error;
      return data as VipPricing;
    },
  });
  const fallback = query.isError && DEV_PREVIEW ? DEV_PREVIEW : BASE_PRICING;
  return { pricing: query.data ?? fallback, now, isLoading: query.isLoading };
}
