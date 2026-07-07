import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { FuelImporter } from "@/hooks/useFuelImporters";
import FuelPriceHistory from "@/components/fuel/FuelPriceHistory";
import FuelCalculator from "@/components/fuel/FuelCalculator";
import {
  Fuel,
  BarChart3,
  Clock,
  Calculator,
  RefreshCw,
  Sparkles,
  ArrowDown,
  ArrowUp,
} from "lucide-react";

/**
 * Octane-tier fuel price comparison (Planflow "fuel" design, real data).
 *
 * Companies name their products differently (Nano Super / Eco Super / Super 100
 * …), but each sells one product per class. We group by class — super (98-100),
 * premium (95-96), regular (92-93), diesel, gas — so users compare like-for-like
 * ("SOCAR super vs Wissol super"). Comparison is the default view.
 */

type TierKey = "super" | "premium" | "regular" | "diesel" | "gas";

const TIERS: { key: TierKey; label: string; sub: string; match: RegExp }[] = [
  { key: "super", label: "სუპერი", sub: "98–100 ოქტ.", match: /სუპერ|super/i },
  { key: "premium", label: "პრემიუმი", sub: "95–96 ოქტ.", match: /პრემიუმ|premium/i },
  { key: "regular", label: "რეგულარი", sub: "92–93 ოქტ.", match: /რეგულარ|regular/i },
  { key: "diesel", label: "დიზელი", sub: "Euro 5", match: /დიზელ|diesel/i },
  { key: "gas", label: "ავტოგაზი", sub: "LPG / CNG", match: /აირ|გაზ|\bgas\b|lpg|cng/i },
];

type SubTab = "compare" | "prices" | "history" | "calc";

const SUB_TABS: { key: SubTab; label: string; Icon: typeof Fuel }[] = [
  { key: "compare", label: "შედარება", Icon: BarChart3 },
  { key: "prices", label: "ფასები", Icon: Fuel },
  { key: "history", label: "ისტორია", Icon: Clock },
  { key: "calc", label: "კალკულატორი", Icon: Calculator },
];

interface TierRow {
  name: string;
  price: number;
  product: string;
}

/** For one tier, one representative (cheapest) product per company, sorted asc. */
function buildTierRows(importers: FuelImporter[], match: RegExp): TierRow[] {
  const rows: TierRow[] = [];
  for (const imp of importers) {
    const matches = (imp.fuelPrices ?? []).filter(
      (f) => typeof f.price === "number" && match.test(`${f.fuelType} ${f.fuelTypeEnglish ?? ""}`),
    );
    if (matches.length === 0) continue;
    const cheapest = matches.reduce((a, b) => (b.price < a.price ? b : a));
    rows.push({ name: imp.name, price: cheapest.price, product: cheapest.fuelType });
  }
  return rows.sort((a, b) => a.price - b.price);
}

const Money = ({ v, className }: { v: number; className?: string }) => (
  <span className={cn("font-mono tabular-nums", className)}>{v.toFixed(2)}</span>
);

interface Props {
  importers: FuelImporter[];
  isLoading?: boolean;
  isRefetching?: boolean;
  onRefresh?: () => void;
}

const FuelPriceExplorer = ({ importers, isLoading, isRefetching, onRefresh }: Props) => {
  const [tier, setTier] = useState<TierKey>("super");
  const [subTab, setSubTab] = useState<SubTab>("compare");

  // Which tiers actually have data (hide empty pills).
  const tierRowsAll = useMemo(() => {
    const map = {} as Record<TierKey, TierRow[]>;
    for (const t of TIERS) map[t.key] = buildTierRows(importers, t.match);
    return map;
  }, [importers]);

  const availableTiers = TIERS.filter((t) => tierRowsAll[t.key].length > 0);
  const activeTier = availableTiers.some((t) => t.key === tier) ? tier : availableTiers[0]?.key ?? "super";
  const rows = tierRowsAll[activeTier] ?? [];
  const tierMeta = TIERS.find((t) => t.key === activeTier)!;

  const cheapest = rows[0];
  const mostExp = rows[rows.length - 1];
  const avg = rows.length ? rows.reduce((a, r) => a + r.price, 0) / rows.length : 0;
  const spread = cheapest && mostExp ? mostExp.price - cheapest.price : 0;

  const showData = !isLoading && rows.length > 0;

  return (
    <div className="space-y-5">
      {/* ── KPI ribbon ── */}
      {showData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: "ყველაზე იაფი", v: cheapest.price.toFixed(2), s: cheapest.name, tone: "accent", unit: true },
            { l: "საშუალო", v: avg.toFixed(2), s: `${rows.length} კომპანია`, tone: "ink", unit: true },
            { l: "ყველაზე ძვირი", v: mostExp.price.toFixed(2), s: mostExp.name, tone: "ink", unit: true },
            { l: "სხვაობა", v: spread.toFixed(2), s: "იაფსა და ძვირს შორის", tone: "brand", unit: true },
          ].map((k, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border/60 p-4">
              <div className="text-[9.5px] uppercase tracking-[0.16em] font-bold text-muted-foreground mb-1.5">{k.l}</div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={cn(
                    "text-[24px] md:text-[26px] font-bold tracking-tight font-mono tabular-nums leading-none",
                    k.tone === "accent" ? "text-orange-600" : k.tone === "brand" ? "text-primary" : "text-foreground",
                  )}
                >
                  {k.v}
                </span>
                {k.unit && <span className="text-[13px] text-muted-foreground">₾</span>}
              </div>
              <div className="mt-1 text-[10.5px] text-muted-foreground truncate">{k.s}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tier pills + sub-tabs ── */}
      <div className="rounded-2xl bg-card border border-border/60 p-2.5 flex flex-col gap-2.5 sticky top-2 z-20">
        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {availableTiers.map((t) => {
            const active = t.key === activeTier;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTier(t.key)}
                className={cn(
                  "shrink-0 h-11 px-3.5 rounded-xl text-left transition border",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-foreground border-transparent hover:bg-muted",
                )}
              >
                <div className="text-[13px] font-bold leading-tight whitespace-nowrap">{t.label}</div>
                <div className={cn("text-[10px] font-medium", active ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {t.sub}
                </div>
              </button>
            );
          })}
        </div>

        <div className="h-px bg-border/60" />

        <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SUB_TABS.map((t) => {
            const active = subTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setSubTab(t.key)}
                className={cn(
                  "shrink-0 h-8 px-3 rounded-full text-[12px] font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition",
                  active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted/70",
                )}
              >
                <t.Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefetching}
              className="ml-auto shrink-0 h-8 px-3 rounded-full text-[12px] font-semibold inline-flex items-center gap-1.5 border border-border hover:border-foreground text-foreground transition disabled:opacity-60"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
              <span className="hidden sm:inline">განახლება</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Loading / empty ── */}
      {isLoading && (
        <div className="rounded-2xl bg-card border border-border/60 p-12 text-center text-muted-foreground">იტვირთება…</div>
      )}
      {!isLoading && rows.length === 0 && subTab !== "history" && subTab !== "calc" && (
        <div className="rounded-2xl bg-card border border-border/60 p-12 text-center">
          <Fuel className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">ამ კლასზე ფასები ჯერ არ არის</p>
        </div>
      )}

      {/* ── COMPARE (default) ── */}
      {showData && subTab === "compare" && (
        <div className="rounded-2xl bg-card border border-border/60 p-5 md:p-6">
          <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-muted-foreground">ბრენდების შედარება</div>
          <h2 className="mt-1 text-[19px] md:text-[20px] font-bold tracking-tight text-foreground mb-5">
            {tierMeta.label} · {rows.length} კომპანია
          </h2>

          <div className="space-y-3">
            {rows.map((r, i) => {
              const pct = spread > 0 ? ((r.price - cheapest.price) / spread) * 100 : 0;
              const isCheapest = i === 0;
              return (
                <div key={r.name} className="grid grid-cols-12 items-center gap-2.5 md:gap-3">
                  <div className="col-span-5 md:col-span-3 flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "h-8 w-8 rounded-lg grid place-items-center text-[10.5px] font-bold shrink-0",
                        isCheapest ? "bg-orange-500 text-white" : "bg-foreground text-background",
                      )}
                    >
                      {r.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="text-[13px] font-bold text-foreground truncate">{r.name}</span>
                  </div>
                  <div className="col-span-4 md:col-span-7 relative h-8 rounded-lg bg-muted overflow-hidden">
                    <div
                      className={cn("absolute inset-y-0 left-0 rounded-lg transition-all", isCheapest ? "bg-orange-500" : "bg-primary")}
                      style={{ width: `${Math.max(pct, 6)}%` }}
                    />
                  </div>
                  <div className="col-span-3 md:col-span-2 text-right">
                    <Money v={r.price} className={cn("text-[14px] font-bold", isCheapest ? "text-orange-600" : "text-foreground")} />
                    <span className="text-[11px] text-muted-foreground ml-1">₾</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl bg-orange-50 border border-orange-200 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] font-bold text-orange-700">ყველაზე იაფი</div>
              <div className="mt-1 text-[16px] font-bold text-foreground">{cheapest.name}</div>
              <div className="mt-1 text-[12px] text-muted-foreground">
                <Money v={cheapest.price} /> ₾/ლ{mostExp.price > 0 && ` · −${(((mostExp.price - cheapest.price) / mostExp.price) * 100).toFixed(1)}%`}
              </div>
            </div>
            <div className="rounded-xl bg-muted/50 border border-border p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] font-bold text-muted-foreground">საშუალო</div>
              <div className="mt-1 text-[16px] font-bold text-foreground"><Money v={avg} /> ₾/ლ</div>
              <div className="mt-1 text-[12px] text-muted-foreground">{rows.length} კომპანიის ბაზაზე</div>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] font-bold text-red-700">ყველაზე ძვირი</div>
              <div className="mt-1 text-[16px] font-bold text-foreground">{mostExp.name}</div>
              <div className="mt-1 text-[12px] text-muted-foreground"><Money v={mostExp.price} /> ₾/ლ</div>
            </div>
          </div>
        </div>
      )}

      {/* ── PRICES table ── */}
      {showData && subTab === "prices" && (
        <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
          <div className="px-5 md:px-6 pt-5 pb-3 border-b border-border/60 flex items-end justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-muted-foreground">დალაგებული ფასის მიხედვით</div>
              <h2 className="mt-1 text-[18px] md:text-[20px] font-bold tracking-tight text-foreground">
                {tierMeta.label} · {rows.length} კომპანია
              </h2>
            </div>
            <div className="text-[11.5px] text-muted-foreground font-mono tabular-nums">₾/ლ</div>
          </div>

          <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-2.5 bg-muted/40 border-b border-border/60 text-[10px] uppercase tracking-[0.14em] font-bold text-muted-foreground">
            <div className="col-span-1">#</div>
            <div className="col-span-5">კომპანია</div>
            <div className="col-span-3 text-right">ფასი</div>
            <div className="col-span-3 text-right">იაფზე მეტი</div>
          </div>

          <ul className="divide-y divide-border/60">
            {rows.map((r, i) => {
              const isCheapest = i === 0;
              const diff = r.price - cheapest.price;
              return (
                <li key={r.name} className={cn("px-5 md:px-6 py-3.5 transition", isCheapest ? "bg-orange-50/40" : "hover:bg-muted/30")}>
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-2 md:col-span-1 flex items-center gap-2">
                      <span className={cn("font-mono tabular-nums text-[13px] font-bold w-6", isCheapest ? "text-orange-600" : "text-muted-foreground")}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="col-span-6 md:col-span-5 flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-foreground text-background grid place-items-center text-[11px] font-bold tracking-wider shrink-0">
                        {r.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[14px] font-bold text-foreground truncate flex items-center gap-1.5">
                          {r.name}
                          {isCheapest && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[9px] font-bold uppercase tracking-[0.12em]">
                              <Sparkles className="h-2.5 w-2.5" />იაფი
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">{r.product}</div>
                      </div>
                    </div>
                    <div className="col-span-4 md:col-span-3 text-right flex items-baseline justify-end gap-1">
                      <Money v={r.price} className={cn("text-[20px] font-bold tracking-tight leading-none", isCheapest ? "text-orange-600" : "text-foreground")} />
                      <span className={cn("text-[11.5px] font-semibold", isCheapest ? "text-orange-600" : "text-muted-foreground")}>₾</span>
                    </div>
                    <div className="hidden md:flex col-span-3 justify-end">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] font-bold font-mono tabular-nums",
                          diff === 0 ? "bg-orange-100 text-orange-700" : "bg-red-50 text-red-700",
                        )}
                      >
                        {diff === 0 ? (
                          <>
                            <ArrowDown className="h-2.5 w-2.5" />საუკეთესო
                          </>
                        ) : (
                          <>
                            <ArrowUp className="h-2.5 w-2.5" />+{diff.toFixed(2)}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── HISTORY / CALC (existing components) ── */}
      {subTab === "history" && (
        <div className="rounded-2xl bg-card border border-border/60 p-1">
          <FuelPriceHistory />
        </div>
      )}
      {subTab === "calc" && (
        <div className="rounded-2xl bg-card border border-border/60 p-1">
          <FuelCalculator />
        </div>
      )}
    </div>
  );
};

export default FuelPriceExplorer;
