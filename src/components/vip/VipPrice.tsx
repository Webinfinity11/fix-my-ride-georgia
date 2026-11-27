import { clock, priceFor, promoActive, useVipPricing, type VipPlan } from "@/lib/vipPricing";

/**
 * The price wherever a plan is chosen. During the promotion the usual price is
 * struck through in red and the new one stands next to it with the discount.
 * "compact" fits inside buttons.
 */
export const VipPrice = ({ plan, compact = false, className = "" }: { plan: VipPlan; compact?: boolean; className?: string }) => {
  const { pricing, now, loading } = useVipPricing();
  const { base, final, discounted, percent } = priceFor(pricing, plan, now);
  const period = pricing.duration_days === 30 ? "1 თვე" : `${pricing.duration_days} დღე`;
  if (loading) return <span aria-hidden="true" className={`block animate-pulse rounded bg-muted ${compact ? "h-5 w-20" : "h-10 w-40"} ${className}`} />;
  return (
    <span className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${className}`}>
      {discounted && (
        <s className={`font-semibold text-gray-500 decoration-red-600 decoration-[3px] ${compact ? "text-sm" : "text-2xl"}`}>
          <span className="sr-only">ძველი ფასი </span>{base} ₾
        </s>
      )}
      <strong className={`${compact ? "text-base" : "text-4xl"} ${discounted ? "text-red-600" : ""}`}>
        {discounted && <span className="sr-only">აქციის ფასი </span>}{final} ₾
      </strong>
      <span className="text-xs font-normal opacity-70">/ {period}</span>
      {discounted && (
        <span className={`rounded-full bg-red-600 font-bold text-white ${compact ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"}`}>
          აქცია −{percent}%
        </span>
      )}
    </span>
  );
};

const NEON = "0 0 4px #fff, 0 0 10px #22d3ee, 0 0 22px #22d3ee, 0 0 40px #0891b2";

/** Neon countdown, ticking every second while the promotion runs. */
export const VipPromoNote = ({ className = "" }: { className?: string }) => {
  const { pricing, now, preview } = useVipPricing();
  if (!promoActive(pricing, now)) return null;
  return (
    <div className={`rounded-xl border border-cyan-400/60 bg-slate-950 px-4 py-3 text-center shadow-[0_0_18px_rgba(34,211,238,0.45)] ${className}`}>
      <p className="text-sm font-bold text-fuchsia-300" style={{ textShadow: "0 0 8px #d946ef, 0 0 18px #d946ef" }}>
        🔥 აქცია სრულდება
      </p>
      {/* Not a live region: a screen reader must not announce every second. */}
      <p role="timer" className="mt-1 font-mono text-4xl font-bold tabular-nums tracking-widest text-cyan-100" style={{ textShadow: NEON }}>
        {clock(pricing.promo_ends_at!, now)}
      </p>
      {preview && <p className="mt-2 text-xs text-amber-300">ლოკალური საცდელი ხედი: საიტზე აქცია ჯერ გამორთულია</p>}
    </div>
  );
};
