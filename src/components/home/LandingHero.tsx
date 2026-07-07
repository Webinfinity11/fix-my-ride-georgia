import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackSearch } from "@/utils/tracking";
import { useFuelImporters } from "@/hooks/useFuelImporters";
import { useFuelStations } from "@/hooks/useFuelStations";
import { useChargers } from "@/hooks/useChargers";

const MiniServiceMap = lazy(() => import("./MiniServiceMap"));

/* ─────────── inline icons (24×24) — from the Planflow "landing" design ─────────── */
type IconProps = { fill?: boolean; className?: string; stroke?: number };
const Icon = ({ d, fill = false, className = "h-5 w-5", stroke = 2 }: IconProps & { d: string }) => (
  <svg viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);
const IWrench = (p: IconProps) => <Icon {...p} d="M14.7 6.3a4 4 0 0 1 5 5L8 23l-6-6L14.7 6.3z M14.7 6.3l3 3" />;
const ISearch = (p: IconProps) => <Icon {...p} d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14z M20 20l-3.5-3.5" />;
const IMap = (p: IconProps) => <Icon {...p} d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z M9 4v14 M15 6v14" />;
const IFuel = (p: IconProps) => <Icon {...p} d="M4 21h10V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16z M14 9h3a2 2 0 0 1 2 2v6a2 2 0 0 0 2 2 M17 5l2 2" />;
const IBolt = (p: IconProps) => <Icon {...p} d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />;
const ICar = (p: IconProps) => <Icon {...p} d="M3 13l2-6a2 2 0 0 1 2-1.4h10a2 2 0 0 1 2 1.4l2 6 M3 13v5h3v-2h12v2h3v-5 M3 13h18 M7 10h10" />;
const IPart = (p: IconProps) => <Icon {...p} d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6z M9 12l2 2 4-4" />;
const IShield = (p: IconProps) => <Icon {...p} d="M12 2 4 5v7c0 5 3.5 9 8 10 4.5-1 8-5 8-10V5z" />;
const ICard = (p: IconProps) => <Icon {...p} d="M3 7h18v12H3z M3 11h18 M6 16h4" />;
const IDealer = (p: IconProps) => <Icon {...p} d="M4 12l2-6h12l2 6 M4 12v6h3v-2h10v2h3v-6 M4 12h16 M9 16h6" />;
const IBriefcase = (p: IconProps) => <Icon {...p} d="M3 7h18v13H3z M9 7V4h6v3 M3 12h18" />;
const IX = (p: IconProps) => <Icon {...p} d="M6 6l12 12 M18 6L6 18" />;
const IArrow = (p: IconProps) => <Icon {...p} d="M5 12h14 M13 5l7 7-7 7" />;
const IPin = (p: IconProps) => <Icon {...p} d="M12 22s-7-7-7-13a7 7 0 1 1 14 0c0 6-7 13-7 13z M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />;
const IGrid = (p: IconProps) => <Icon {...p} d="M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z" />;
const IDown = (p: IconProps) => <Icon {...p} d="M6 9l6 6 6-6" />;
const ISpark = (p: IconProps) => <Icon {...p} d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z" />;
const IRefresh = (p: IconProps) => <Icon {...p} d="M4 12a8 8 0 0 1 14-5.3L21 4 M21 4v6h-6 M20 12a8 8 0 0 1-14 5.3L3 20 M3 20v-6h6" />;

const PulseDot = ({ color = "accent" }: { color?: "success" | "accent" | "info" }) => {
  const c = { success: "bg-success-500", accent: "bg-accent-500", info: "bg-info-500" }[color];
  return (
    <span className="relative flex h-2 w-2">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c} opacity-70`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${c}`} />
    </span>
  );
};

const POPULAR = [
  "ძრავის შეკეთება", "ზეთის შეცვლა", "დიაგნოსტიკა", "ვულკანიზაცია",
  "ელექტროობა", "სამღებრო სამუშაოები", "სავალი ნაწილის შეკეთება", "კონდინციონერი (ფრეონი)",
];

const VERTICALS = [
  { l: "ხელოსანი", v: "512 აქტიური", i: IWrench, c: "bg-brand-50 text-brand-700", to: "/services" },
  { l: "საწვავი", v: "550+ სადგური", i: IFuel, c: "bg-accent-50 text-accent-700", to: "/fuel-importers" },
  { l: "EV დამტენი", v: "100+ ლოკაცია", i: IBolt, c: "bg-success-50 text-success-700", to: "/map/chargers" },
  { l: "ნაწილი", v: "24სთ-ში", i: IPart, c: "bg-iris-50 text-iris-700", to: "/order-parts" },
  { l: "სამრეცხაო", v: "72 ლოკაცია", i: ICar, c: "bg-info-50 text-info-700", to: "/map/laundries" },
  { l: "დილერი", v: "48 ცენტრი", i: IDealer, c: "bg-brand-50 text-brand-700", to: "/dealers" },
  { l: "დაზღვევა", v: "7 კომპანია", i: IShield, c: "bg-accent-50 text-accent-700", to: "/insurance" },
  { l: "ლიზინგი", v: "9 პარტნიორი", i: ICard, c: "bg-ink-100 text-ink-800", to: "/leasing" },
  { l: "ვაკანსიები", v: "128 ღია", i: IBriefcase, c: "bg-ink-100 text-ink-800", to: "/vacancies" },
];

// Fuel snapshot fallback (design sample) — used only until the real prices load.
type FuelRow = { b: string; p: string; k: string; d?: string; s?: number; best?: boolean };
// Match a fuel product to the bento's premium/regular/diesel toggle by tier.
const FUEL_TIER_MATCH: Record<"premium" | "regular" | "diesel", RegExp> = {
  premium: /პრემიუმ|premium|სუპერ|super/i, // 95-98 (mid/top grade)
  regular: /რეგულარ|regular/i,
  diesel: /დიზელ|diesel/i,
};
const FUEL: Record<"premium" | "regular" | "diesel", FuelRow[]> = {
  premium: [
    { b: "Connect", p: "3.05", d: "−0.03", k: "CO", s: 187, best: true }, { b: "SOCAR", p: "3.18", d: "−0.04", k: "SO", s: 121 },
    { b: "Wissol", p: "3.21", d: "0.00", k: "WS", s: 98 }, { b: "Gulf", p: "3.24", d: "+0.02", k: "GU", s: 76 },
    { b: "Rompetrol", p: "3.27", d: "+0.01", k: "RP", s: 54 },
  ],
  regular: [
    { b: "Connect", p: "2.89", d: "−0.02", k: "CO", s: 187, best: true }, { b: "SOCAR", p: "2.98", d: "−0.03", k: "SO", s: 121 },
    { b: "Wissol", p: "3.01", d: "0.00", k: "WS", s: 98 }, { b: "Gulf", p: "3.04", d: "+0.02", k: "GU", s: 76 },
  ],
  diesel: [
    { b: "Connect", p: "3.11", d: "−0.02", k: "CO", s: 187, best: true }, { b: "SOCAR", p: "3.24", d: "−0.04", k: "SO", s: 121 },
    { b: "Wissol", p: "3.28", d: "0.00", k: "WS", s: 98 }, { b: "Gulf", p: "3.31", d: "+0.02", k: "GU", s: 76 },
  ],
};
const FUEL_LABELS: Record<"premium" | "regular" | "diesel", string> = { premium: "ბენ. 95", regular: "ბენ. 92", diesel: "დიზელი" };

interface Category { id: string; name: string }

const LandingHero = () => {
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [catFilter, setCatFilter] = useState("");

  const [bentoTab, setBentoTab] = useState<"map" | "fuel">("map");
  const [mapTab, setMapTab] = useState<"mechanic" | "fuel" | "ev">("mechanic");
  const [fuelKind, setFuelKind] = useState<"premium" | "regular" | "diesel">("premium");
  const [locating, setLocating] = useState(false);
  const [locLabel, setLocLabel] = useState<string | null>(null);
  const [serviceCount, setServiceCount] = useState(0);

  const marqueePaused = useRef(false);

  // Real map-layer counts (mirrors the /map page).
  const { stations } = useFuelStations();
  const { chargers } = useChargers();

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from("service_categories").select("id, name").order("name");
      if (cats) setCategories(cats.map((c: { id: number | string; name: string }) => ({ id: String(c.id), name: c.name })));
      const { data: svc } = await supabase.from("mechanic_services").select("city").eq("is_active", true).not("city", "is", null);
      if (svc) setCities([...new Set(svc.map((s: { city: string | null }) => s.city).filter(Boolean))].sort() as string[]);
      const { count } = await supabase
        .from("mechanic_services")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      if (typeof count === "number") setServiceCount(count);
    })();
  }, []);

  const categoryName = selectedCategory === "all" ? null : categories.find((c) => c.id === selectedCategory)?.name ?? null;
  const cityLabel = selectedCity === "all" ? null : selectedCity;
  const hasActive = !!(inputValue || categoryName || cityLabel);
  const popularExisting = POPULAR.filter((p) => categories.some((c) => c.name === p));

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = inputValue.trim();
    if (q) trackSearch(q, "home");
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedCity !== "all") params.set("city", selectedCity);
    navigate(`/services${params.toString() ? `?${params}` : ""}`);
  };

  const pickCategoryByName = (name: string) => {
    const c = categories.find((x) => x.name === name);
    if (c) setSelectedCategory(c.id);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocLabel(`${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`); setLocating(false); },
      () => setLocating(false),
      { timeout: 8000 },
    );
  };

  // Real fuel prices (shared platform cache) — cheapest product per company for
  // the selected tier, sorted. Falls back to the design sample until loaded.
  const { data: importers = [] } = useFuelImporters({ english: true });
  const realFuelRows: FuelRow[] = (() => {
    const match = FUEL_TIER_MATCH[fuelKind];
    const rows = importers
      .map((imp) => {
        const matches = (imp.fuelPrices ?? []).filter(
          (f) => typeof f.price === "number" && match.test(`${f.fuelType} ${f.fuelTypeEnglish ?? ""}`),
        );
        if (!matches.length) return null;
        const cheapest = matches.reduce((a, b) => (b.price < a.price ? b : a));
        return { b: imp.name, p: cheapest.price.toFixed(2), k: imp.name.slice(0, 2).toUpperCase() };
      })
      .filter(Boolean) as FuelRow[];
    return rows.sort((a, b) => parseFloat(a.p) - parseFloat(b.p)).map((r, i) => ({ ...r, best: i === 0 }));
  })();
  const fuelRows: FuelRow[] = realFuelRows.length > 0 ? realFuelRows : FUEL[fuelKind];
  const layerCounts: Record<"mechanic" | "fuel" | "ev", number> = {
    mechanic: serviceCount,
    fuel: stations.length,
    ev: chargers.length,
  };
  const mapCount = String(layerCounts[mapTab] || (mapTab === "mechanic" ? 512 : mapTab === "fuel" ? 62 : 18));

  return (
    <section
      className="relative overflow-hidden bg-ink-50 flex flex-col lg:flex-1 lg:min-h-0"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v1H0z' fill='%23334155' fill-opacity='0.05'/%3E%3Cpath d='M0 0v60h1V0z' fill='%23334155' fill-opacity='0.05'/%3E%3C/svg%3E\")",
        backgroundSize: "60px 60px",
      }}
    >
      <style>{`
        @keyframes ldMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes ldGearFloat { 0%,100%{transform:translate(0,0) rotate(0deg)} 33%{transform:translate(-4px,5px) rotate(8deg)} 66%{transform:translate(3px,-3px) rotate(-5deg)} }
      `}</style>

      {/* decorative gear — bottom-left */}
      <div className="absolute -bottom-20 -left-20 pointer-events-none animate-spin text-brand-600 hidden md:block" style={{ animationDuration: "26s", animationTimingFunction: "linear", opacity: 0.07 }}>
        <svg width="360" height="360" viewBox="0 0 24 24" fill="currentColor"><path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" /></svg>
      </div>

      <div className="relative z-10 lg:flex-1 lg:min-h-0 flex flex-col lg:justify-center overflow-hidden">
      <div className="max-w-[1280px] mx-auto w-full px-4 lg:px-8 py-5 lg:py-4">

        {/* Channel-style live bar */}
        <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
          <div className="inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-pill bg-ink-900 text-white text-[10px] font-bold uppercase tracking-[0.18em]">
              <PulseDot color="accent" />fixup.live
            </span>
            <span className="text-[11.5px] text-ink-700"><span className="font-mono tabular-nums font-semibold text-ink-900">512</span> ხელოსანი სისტემაში</span>
          </div>
          <div className="hidden md:inline-flex items-center gap-2 text-[11.5px] text-ink-500 font-mono tabular-nums">
            <span>USD/GEL</span><span className="text-ink-900 font-semibold">2.72</span>
            <span className="text-ink-300">·</span>
            <span>ბენზინი 95</span><span className="text-ink-900 font-semibold">3.05₾</span>
          </div>
        </div>

        {/* Verticals marquee */}
        <div className="overflow-hidden mb-5" onMouseEnter={() => (marqueePaused.current = true)} onMouseLeave={() => (marqueePaused.current = false)}>
          <div className="flex gap-2 w-max" style={{ animation: "ldMarquee 32s linear infinite" }}
            onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
            onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}>
            {[...VERTICALS, ...VERTICALS].map((v, i) => (
              <button key={i} type="button" onClick={() => navigate(v.to)}
                className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-btn bg-white border border-ink-200 hover:border-brand-400 hover:shadow-xs transition text-left">
                <span className={`h-7 w-7 rounded-lg grid place-items-center shrink-0 ${v.c}`}><v.i className="h-3.5 w-3.5" /></span>
                <span>
                  <span className="block text-[12.5px] font-semibold text-ink-900 leading-none">{v.l}</span>
                  <span className="block text-[10px] font-mono tabular-nums text-ink-400 mt-0.5">{v.v}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* BENTO GRID */}
        <div className="grid grid-cols-12 gap-3 md:gap-4">

          {/* A · Search (dark) */}
          <div className="col-span-12 lg:col-span-7 rounded-card border border-brand-800 bg-brand-900 text-white p-5 md:p-6 relative overflow-hidden flex flex-col justify-center">
            <div aria-hidden className="pointer-events-none absolute -top-8 -right-8 w-36 h-36 text-white opacity-[0.10]" style={{ animation: "ldGearFloat 9s ease-in-out infinite" }}>
              <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="60" cy="60" r="46" /><circle cx="60" cy="60" r="20" /><line x1="60" y1="14" x2="60" y2="28" /><line x1="60" y1="92" x2="60" y2="106" /><line x1="14" y1="60" x2="28" y2="60" /><line x1="92" y1="60" x2="106" y2="60" /></svg>
            </div>
            <h1 className="text-[26px] md:text-[34px] font-bold leading-tight tracking-tight text-white mb-1">იპოვე ავტოხელოსანი</h1>
            <div className="text-[10.5px] uppercase tracking-[0.2em] font-semibold text-accent-300 mb-3">მოძებნე სერვისი საქართველოში</div>

            <form onSubmit={handleSearch}>
              <div className="rounded-2xl bg-white border border-ink-200/60 shadow-[0_4px_22px_rgba(255,255,255,0.12)] p-3 space-y-2">
                <div className="relative">
                  <ISearch className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                  <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                    placeholder="ძიება სერვისში, კატეგორიაში, ხელოსნის სახელსა და ნომერში..."
                    className="w-full h-12 pl-11 pr-10 rounded-xl bg-white border border-ink-200 text-[13.5px] text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-ink-900 focus:ring-2 focus:ring-brand-500/20 transition" />
                  {inputValue && (
                    <button type="button" onClick={() => setInputValue("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-ink-400 hover:text-ink-900 hover:bg-ink-100 grid place-items-center"><IX className="h-3.5 w-3.5" /></button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setCatOpen(true)}
                    className={`h-12 px-4 rounded-xl text-left inline-flex items-center gap-2 transition border ${categoryName ? "bg-brand-50/60 border-brand-200" : "bg-white border-ink-200 hover:border-ink-900"}`}>
                    <IGrid className={`h-4 w-4 shrink-0 ${categoryName ? "text-brand-600" : "text-ink-400"}`} />
                    <span className={`text-[13.5px] font-medium truncate flex-1 ${categoryName ? "text-brand-800" : "text-ink-700"}`}>{categoryName ?? "ყველა კატეგორია"}</span>
                    <IDown className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                  </button>
                  <button type="button" onClick={() => setCityOpen(true)}
                    className={`h-12 px-4 rounded-xl text-left inline-flex items-center gap-2 transition border ${cityLabel ? "bg-brand-50/60 border-brand-200" : "bg-white border-ink-200 hover:border-ink-900"}`}>
                    <IPin className={`h-4 w-4 shrink-0 ${cityLabel ? "text-brand-600" : "text-ink-400"}`} />
                    <span className={`text-[13.5px] font-medium truncate flex-1 ${cityLabel ? "text-brand-800" : "text-ink-700"}`}>{cityLabel ?? "ყველა ქალაქი"}</span>
                    <IDown className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                  </button>
                </div>

                <button type="submit" className="w-full h-12 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-[14px] font-bold inline-flex items-center justify-center gap-2 transition">
                  <ISearch className="h-4 w-4" />ძიება
                </button>

                {hasActive && (
                  <div className="mt-1 px-1.5 pt-2 border-t border-ink-100 flex items-center gap-2 flex-wrap">
                    <span className="text-[10.5px] uppercase tracking-[0.14em] font-bold text-ink-400 shrink-0">აქტიური:</span>
                    {inputValue && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-ink-100 text-ink-800 text-[11.5px] font-semibold">„{inputValue.slice(0, 22)}"<button type="button" onClick={() => setInputValue("")}><IX className="h-3 w-3" /></button></span>}
                    {categoryName && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-brand-50 text-brand-700 text-[11.5px] font-semibold"><IGrid className="h-3 w-3" />{categoryName}<button type="button" onClick={() => setSelectedCategory("all")}><IX className="h-3 w-3" /></button></span>}
                    {cityLabel && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-brand-50 text-brand-700 text-[11.5px] font-semibold"><IPin className="h-3 w-3" />{cityLabel}<button type="button" onClick={() => setSelectedCity("all")}><IX className="h-3 w-3" /></button></span>}
                    <button type="button" onClick={() => { setInputValue(""); setSelectedCategory("all"); setSelectedCity("all"); }} className="ml-auto text-[11px] text-ink-300 hover:text-white underline underline-offset-2 font-semibold">გასუფთავება</button>
                  </div>
                )}
              </div>

              {popularExisting.length > 0 && (
                <div className="mt-4 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-ink-300 shrink-0">პოპულარული:</span>
                  {popularExisting.slice(0, 6).map((p) => {
                    const active = categoryName === p;
                    return (
                      <button key={p} type="button" onClick={() => (active ? setSelectedCategory("all") : pickCategoryByName(p))}
                        className={`shrink-0 whitespace-nowrap h-8 px-3 rounded-pill border text-[11.5px] font-semibold transition ${active ? "bg-white border-white text-brand-900" : "bg-brand-800 border-brand-700 text-ink-100 hover:bg-brand-700"}`}>{p}</button>
                    );
                  })}
                </div>
              )}
            </form>
          </div>

          {/* B · Map / Fuel tile */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-3 rounded-card border border-ink-200 bg-white p-3 md:p-4">
            <div className="flex bg-ink-100 rounded-btn p-0.5 w-full">
              {(["map", "fuel"] as const).map((k) => (
                <button key={k} type="button" onClick={() => setBentoTab(k)}
                  className={`flex-1 h-8 px-3 text-[11.5px] font-semibold inline-flex items-center justify-center gap-1.5 transition rounded-btn ${bentoTab === k ? "bg-white text-ink-900" : "text-ink-500 hover:text-ink-900"}`}>
                  {k === "map" ? <IMap className="h-3.5 w-3.5" /> : <IFuel className="h-3.5 w-3.5" />}{k === "map" ? "რუკა" : "საწვავის ფასები"}
                </button>
              ))}
            </div>

            <div className="h-[440px] lg:h-[520px] rounded-card border border-ink-200 bg-white overflow-hidden flex flex-col">
              {bentoTab === "map" ? (
                <>
                  <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2 border-b border-ink-100 flex-wrap">
                    <div className="inline-flex items-center gap-2">
                      <IMap className="h-4 w-4 text-ink-700" />
                      <span className="text-[12.5px] font-bold text-ink-900">უახლოესი თქვენთან</span>
                      {locLabel && <span className="text-[10.5px] text-accent-600 font-medium tabular-nums">{locLabel}</span>}
                    </div>
                    <div className="flex bg-ink-100 rounded-btn p-0.5">
                      {([{ k: "mechanic" as const, l: "ხელოსანი" }, { k: "fuel" as const, l: "საწვავი" }, { k: "ev" as const, l: "EV" }].map((t) => ({ ...t, n: String(layerCounts[t.k] || "") }))).map((t) => (
                        <button key={t.k} type="button" onClick={() => setMapTab(t.k)} className={`h-7 px-2.5 rounded-btn text-[11px] font-semibold inline-flex items-center gap-1.5 transition ${mapTab === t.k ? "bg-white text-ink-900 shadow-xs" : "text-ink-500 hover:text-ink-900"}`}>
                          {t.l} <span className={`font-mono tabular-nums text-[9.5px] ${mapTab === t.k ? "text-accent-600" : "text-ink-400"}`}>{t.n}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative bg-ink-100 overflow-hidden flex-1 z-0">
                    <Suspense fallback={<div className="absolute inset-0 grid place-items-center text-ink-400 text-[11px] animate-pulse">რუკა იტვირთება…</div>}>
                      <MiniServiceMap layer={mapTab} />
                    </Suspense>
                    <button type="button" onClick={detectLocation} title="ჩემი მდებარეობა" className={`absolute top-3 right-3 z-[400] inline-flex items-center justify-center h-10 w-10 rounded-btn border-2 shadow-pop transition ${locating ? "border-accent-300 bg-accent-50 text-accent-500" : locLabel ? "border-accent-400 bg-accent-50 text-accent-700" : "border-ink-200 bg-white text-ink-600 hover:border-accent-400 hover:text-accent-700"}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${locating ? "animate-spin" : ""}`}>{locating ? <path d="M21 12a9 9 0 1 1-6.219-8.56" /> : <><circle cx="12" cy="12" r="3" /><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /></>}</svg>
                    </button>
                  </div>

                  <div className="px-4 py-3 border-t border-ink-100 flex items-center justify-between gap-2">
                    <div className="text-[11.5px] text-ink-600"><span className="font-mono tabular-nums font-semibold text-ink-900">{mapCount}</span> შედეგი · 5კმ</div>
                    <button type="button" onClick={() => navigate("/map")} className="h-8 px-3 rounded-btn bg-ink-900 hover:bg-ink-800 text-white text-[11.5px] font-semibold inline-flex items-center gap-1">სრული რუკა <IArrow className="h-3 w-3" /></button>
                  </div>
                </>
              ) : (
                <>
                  <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2 border-b border-ink-100 flex-wrap">
                    <div className="inline-flex items-center gap-2">
                      <IFuel className="h-4 w-4 text-ink-700" />
                      <div><div className="text-[12.5px] font-bold text-ink-900 leading-tight">საწვავის ფასი დღეს</div><div className="text-[10.5px] text-ink-500">ბოლო განახლება</div></div>
                    </div>
                    <div className="flex bg-ink-100 rounded-btn p-0.5">
                      {(["premium", "regular", "diesel"] as const).map((k) => (
                        <button key={k} type="button" onClick={() => setFuelKind(k)} className={`h-7 px-2.5 rounded-btn text-[11px] font-semibold capitalize transition ${fuelKind === k ? "bg-white text-ink-900 shadow-xs" : "text-ink-500 hover:text-ink-900"}`}>{k}</button>
                      ))}
                    </div>
                  </div>

                  <div className="px-4 py-4 flex-1 overflow-y-auto">
                    <div className="flex items-center gap-3 pb-4 border-b border-ink-100 mb-3">
                      <span className="h-11 w-11 rounded-xl bg-accent-500 text-white grid place-items-center text-[13px] font-bold tracking-wider shrink-0">{fuelRows[0].k}</span>
                      <div className="flex-1 min-w-0">
                        <div className="inline-flex items-center gap-1.5 flex-wrap"><span className="text-[13px] font-bold text-ink-900">{fuelRows[0].b}</span><span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-accent-500 text-white">ყველაზე იაფი</span></div>
                        <div className="text-[10.5px] text-ink-500 inline-flex items-center gap-1"><ISpark className="h-3 w-3 text-accent-500" />საუკეთესო ფასი</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono tabular-nums text-[30px] font-bold text-ink-900 leading-none">{fuelRows[0].p}<span className="text-[15px] text-ink-500 font-normal">₾</span></div>
                        <div className="text-ink-400 text-[10.5px] font-mono mt-0.5">₾ / ლიტრი</div>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {fuelRows.slice(1).map((r) => (
                        <div key={r.b} className="flex items-center gap-2.5 text-[12.5px]">
                          <span className="h-8 w-8 rounded-md bg-ink-100 text-ink-700 grid place-items-center text-[10px] font-bold shrink-0">{r.k}</span>
                          <span className="font-medium text-ink-900 flex-1 truncate">{r.b}</span>
                          <span className="font-mono font-bold text-ink-900 tabular-nums">{r.p} ₾</span>
                          {r.d && <span className={`font-mono text-[11px] w-10 text-right tabular-nums ${r.d.startsWith("+") ? "text-danger-600" : r.d.startsWith("−") ? "text-success-600" : "text-ink-400"}`}>{r.d}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button type="button" onClick={() => navigate("/fuel-importers")} className="w-full h-10 border-t border-ink-100 hover:bg-ink-50 text-ink-900 text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 transition shrink-0">
                    სრული შედარება <IArrow className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Fuel price ticker */}
      <div className="relative z-10 bg-ink-900 text-white border-t border-ink-800 shrink-0">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-2 flex items-center gap-3">
          <div className="inline-flex items-center gap-2 shrink-0"><PulseDot color="accent" /><span className="text-[10.5px] uppercase tracking-[0.2em] font-bold text-accent-400 hidden sm:inline">საწვავი · ფასი</span></div>
          <span className="h-3 w-px bg-white/15 shrink-0" />
          <div className="flex items-center gap-1 shrink-0">
            {(["premium", "regular", "diesel"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setFuelKind(k)} className={`h-6 px-2.5 rounded-pill text-[10.5px] font-semibold transition ${fuelKind === k ? "bg-accent-500 text-white" : "bg-white/[0.08] hover:bg-white/[0.14] text-ink-400"}`}>{FUEL_LABELS[k]}</button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden min-w-0">
            <div className="flex items-center gap-5 w-max" style={{ animation: "ldMarquee 28s linear infinite" }}
              onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
              onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}>
              {[...fuelRows, ...fuelRows].map((item, idx) => (
                <div key={`${item.b}-${idx}`} className="flex items-center gap-1.5 shrink-0">
                  <span className={`h-5 w-7 rounded text-[9px] font-bold grid place-items-center ${item.best ? "bg-accent-500 text-white" : "bg-white/10 text-ink-400"}`}>{item.k}</span>
                  <span className="text-[13px] font-bold font-mono tabular-nums text-white leading-none">{item.p}<span className="text-[10px] font-normal text-ink-500 ml-0.5">₾/ლ</span></span>
                  {item.d && <span className={`text-[10px] font-mono tabular-nums ${item.d.startsWith("−") ? "text-success-400" : item.d.startsWith("+") ? "text-danger-400" : "text-ink-500"}`}>{item.d}</span>}
                  {item.best && <span className="text-[8.5px] font-bold uppercase tracking-wide text-accent-400">იაფი</span>}
                  <span className="w-px h-3 bg-white/15" />
                </div>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => navigate("/fuel-importers")} className="ml-auto shrink-0 inline-flex items-center gap-1 h-6 px-2 rounded-btn bg-white/[0.07] hover:bg-white/[0.13] text-ink-400 hover:text-white text-[10.5px] transition"><IRefresh className="h-3 w-3" /><span className="hidden md:inline">სრული</span></button>
        </div>
      </div>

      {/* Category picker */}
      {catOpen && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => { setCatOpen(false); setCatFilter(""); }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()} className="relative w-full md:w-[70vw] md:max-w-[1100px] max-h-[80vh] md:max-h-[680px] rounded-t-2xl md:rounded-2xl bg-white shadow-float border border-ink-200 flex flex-col">
            <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0"><span className="h-1.5 w-10 rounded-full bg-ink-200" /></div>
            <div className="px-5 pt-3 pb-3 border-b border-ink-100 flex items-center justify-between">
              <div><div className="text-[10px] uppercase tracking-[0.16em] font-bold text-ink-400">აირჩიე</div><h3 className="text-[18px] font-bold text-ink-900">კატეგორია</h3></div>
              <button type="button" onClick={() => { setCatOpen(false); setCatFilter(""); }} className="h-9 w-9 rounded-full grid place-items-center hover:bg-ink-100 text-ink-500"><IX className="h-4.5 w-4.5" /></button>
            </div>
            <div className="px-5 pt-3 shrink-0">
              <div className="relative"><ISearch className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" /><input autoFocus value={catFilter} onChange={(e) => setCatFilter(e.target.value)} placeholder="ფილტრი..." className="w-full h-11 pl-10 pr-9 rounded-xl bg-ink-50 border border-ink-200 text-[13.5px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/20" /></div>
              <button type="button" onClick={() => { setSelectedCategory("all"); setCatOpen(false); setCatFilter(""); }} className={`mt-2 w-full flex items-center gap-3 px-3 h-12 rounded-xl border text-left transition ${selectedCategory === "all" ? "bg-brand-50 border-brand-200" : "bg-white border-ink-200 hover:border-ink-300"}`}>
                <span className={`h-5 w-5 rounded-md grid place-items-center ${selectedCategory === "all" ? "bg-brand-500 text-white" : "border border-ink-300"}`}>{selectedCategory === "all" && <IArrow className="h-3 w-3 rotate-90" />}</span>
                <IGrid className="h-4 w-4 text-ink-500" /><span className="text-[13.5px] font-semibold text-ink-900 flex-1">ყველა კატეგორია</span><span className="text-[11px] text-ink-400 font-mono">{categories.length}</span>
              </button>
            </div>
            <div className="px-5 py-3 overflow-y-auto">
              {!catFilter.trim() && popularExisting.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2 text-[11px] uppercase tracking-[0.14em] font-bold text-ink-400">
                    <ISpark className="h-3.5 w-3.5 text-accent-500" />პოპულარული
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {popularExisting.map((p) => (
                      <button key={p} type="button" onClick={() => { pickCategoryByName(p); setCatOpen(false); setCatFilter(""); }}
                        className="h-8 px-3 rounded-pill border border-ink-200 bg-white text-[11.5px] font-semibold text-ink-700 hover:border-brand-400 hover:text-brand-700 transition">
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!catFilter.trim() && (
                <div className="text-[11px] uppercase tracking-[0.14em] font-bold text-ink-400 mb-2">
                  ყველა კატეგორია <span className="text-ink-300 font-mono">{categories.length}</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
                {categories.filter((c) => !catFilter.trim() || c.name.toLowerCase().includes(catFilter.trim().toLowerCase())).map((c) => {
                  const active = selectedCategory === c.id;
                  return (
                    <button key={c.id} type="button" onClick={() => { setSelectedCategory(c.id); setCatOpen(false); setCatFilter(""); }} className={`w-full flex items-center gap-3 px-3.5 h-11 rounded-xl border text-left transition ${active ? "bg-brand-50 border-brand-200 text-brand-700" : "bg-white border-ink-200 hover:bg-ink-50"}`}>
                      <span className="text-[13px] font-medium truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>, document.body)}

      {/* City picker */}
      {cityOpen && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setCityOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()} className="relative w-full md:w-[70vw] md:max-w-[720px] rounded-t-2xl md:rounded-2xl bg-white shadow-float border border-ink-200">
            <div className="md:hidden flex justify-center pt-2.5 pb-1"><span className="h-1.5 w-10 rounded-full bg-ink-200" /></div>
            <div className="px-5 pt-3 pb-3 border-b border-ink-100 flex items-center justify-between">
              <div><div className="text-[10px] uppercase tracking-[0.16em] font-bold text-ink-400">აირჩიე</div><h3 className="text-[18px] font-bold text-ink-900">ქალაქი</h3></div>
              <button type="button" onClick={() => setCityOpen(false)} className="h-9 w-9 rounded-full grid place-items-center hover:bg-ink-100 text-ink-500"><IX className="h-4.5 w-4.5" /></button>
            </div>
            <div className="p-5">
              <button type="button" onClick={() => { setSelectedCity("all"); setCityOpen(false); }} className={`w-full flex items-center gap-3 px-3 h-12 rounded-xl border text-left mb-2 ${selectedCity === "all" ? "bg-brand-50 border-brand-200" : "bg-white border-ink-200 hover:border-ink-300"}`}>
                <IPin className="h-4 w-4 text-ink-500" /><span className="text-[13.5px] font-semibold text-ink-900">ყველა ქალაქი</span>
              </button>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                {cities.map((c) => {
                  const active = selectedCity === c;
                  return (
                    <button key={c} type="button" onClick={() => { setSelectedCity(c); setCityOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 h-11 rounded-xl border text-left transition ${active ? "bg-brand-50 border-brand-200 text-brand-700" : "bg-white border-ink-200 hover:bg-ink-50"}`}>
                      <span className="text-[13px] font-medium truncate">{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>, document.body)}
    </section>
  );
};

export default LandingHero;
