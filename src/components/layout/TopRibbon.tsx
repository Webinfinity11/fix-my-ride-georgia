import { useNavigate } from "react-router-dom";
import { useFuelImporters } from "@/hooks/useFuelImporters";

/* Top utility bar — sits ABOVE the header (Planflow "landing" design). */

type IconProps = { className?: string };
const IPin = ({ className = "h-3.5 w-3.5" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s-7-7-7-13a7 7 0 1 1 14 0c0 6-7 13-7 13z M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
  </svg>
);
const IDown = ({ className = "h-3 w-3" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9l6 6 6-6" /></svg>
);
const IPhone = ({ className = "h-3 w-3" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </svg>
);
const PulseDot = () => (
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-500 opacity-70" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500" />
  </span>
);

const PREMIUM_MATCH = /პრემიუმ|premium|სუპერ|super/i;

const TopRibbon = () => {
  const navigate = useNavigate();

  // Real "today's fuel prices" — cheapest premium per company (same source as
  // the /fuel-importers page and the homepage bento).
  const { data: importers = [] } = useFuelImporters({ english: true });
  const premium = importers
    .map((imp) => {
      const m = (imp.fuelPrices ?? []).filter(
        (f) => typeof f.price === "number" && PREMIUM_MATCH.test(`${f.fuelType} ${f.fuelTypeEnglish ?? ""}`),
      );
      if (!m.length) return null;
      return { name: imp.name, price: m.reduce((a, b) => (b.price < a.price ? b : a)).price };
    })
    .filter(Boolean)
    .sort((a, b) => a!.price - b!.price) as { name: string; price: number }[];
  const cheapest = premium[0];
  const socar = premium.find((r) => /socar/i.test(r.name));
  const wissol = premium.find((r) => /wissol/i.test(r.name));

  return (
    <div className="bg-ink-900 text-ink-100 text-[11.5px]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 h-9 flex items-center gap-4 overflow-x-auto scrollbar-hide">
        <button type="button" onClick={() => navigate("/map")} className="inline-flex items-center gap-1.5 font-mono tabular-nums hover:text-white shrink-0">
          <IPin className="h-3.5 w-3.5 text-accent-400" />თბილისი<IDown className="h-3 w-3 opacity-60" />
        </button>
        <span className="h-3 w-px bg-white/15 shrink-0" />
        {cheapest && (
          <button type="button" onClick={() => navigate("/fuel-importers")} className="hidden md:inline-flex items-center gap-2 font-mono tabular-nums shrink-0 hover:text-white">
            <PulseDot />
            <span className="text-ink-400">დღეს · იაფი</span>
            <span className="text-accent-400 font-semibold">{cheapest.name}</span>
            <span className="text-white font-semibold">{cheapest.price.toFixed(2)} ₾</span>
            {socar && (<><span className="text-ink-500">SOCAR</span><span className="text-white">{socar.price.toFixed(2)} ₾</span></>)}
            {wissol && (<><span className="text-ink-500">Wissol</span><span className="text-white">{wissol.price.toFixed(2)} ₾</span></>)}
          </button>
        )}
        <div className="ml-auto flex items-center gap-4 shrink-0">
          <a href="tel:+995574047994" className="hidden md:inline-flex items-center gap-1.5 font-mono tabular-nums hover:text-white"><IPhone className="h-3 w-3" />+995 574 04 79 94</a>
          <button type="button" onClick={() => navigate("/login")} className="hover:text-white font-semibold">შესვლა</button>
        </div>
      </div>
    </div>
  );
};

export default TopRibbon;
