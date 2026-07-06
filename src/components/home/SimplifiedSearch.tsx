import { useState, useRef, useCallback, useEffect, startTransition } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { trackSearch } from "@/utils/tracking";
import { Search, MapPin, LayoutGrid, X, ChevronDown, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface ServiceCategory {
  id: number;
  name: string;
}

// Popular category names (matched against the real DB categories).
const POPULAR = [
  "ძრავის შეკეთება", "ზეთის შეცვლა", "დიაგნოსტიკა", "ვულკანიზაცია",
  "ელექტროობა", "სამღებრო სამუშაოები", "სავალი ნაწილის შეკეთება", "კონდინციონერი (ფრეონი)",
];

const SimplifiedSearch = ({ onEvacuatorClick }: { onEvacuatorClick?: () => void }) => {
  void onEvacuatorClick;
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const searchTermRef = useRef("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all"); // "all" | category id
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [catOpen, setCatOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [catFilter, setCatFilter] = useState("");

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = useCallback(async () => {
    startTransition(() => {
      (async () => {
        const [cRes, cityRes] = await Promise.all([
          supabase.from("service_categories").select("id, name").order("name"),
          supabase.from("mechanic_services").select("city").not("city", "is", null),
        ]);
        if (cRes.data) setCategories(cRes.data);
        if (cityRes.data) setCities([...new Set(cityRes.data.map(c => c.city).filter(Boolean) as string[])].sort());
      })();
    });
  }, []);

  const categoryName = selectedCategory === "all" ? null : categories.find(c => c.id.toString() === selectedCategory)?.name || null;
  const cityName = selectedCity === "all" ? null : selectedCity;

  const pickCategoryByName = (name: string) => {
    const c = categories.find(x => x.name === name);
    if (c) setSelectedCategory(c.id.toString());
  };

  const filteredCats = categories.filter(c => !catFilter.trim() || c.name.toLowerCase().includes(catFilter.trim().toLowerCase()));
  const popularExisting = POPULAR.filter(p => categories.some(c => c.name === p));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputValue.trim();
    if (q) trackSearch(q, "home");
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedCity !== "all") params.set("city", selectedCity);
    navigate(`/services?${params.toString()}`);
  };

  const reset = () => { setInputValue(""); searchTermRef.current = ""; setSelectedCategory("all"); setSelectedCity("all"); };
  const hasActive = !!(inputValue || categoryName || cityName);

  return (
    <div className="w-full">
      <form onSubmit={handleSearch}>
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-3 md:p-4 space-y-2">
          {/* Row 1 — free text */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="ძიება სერვისში, კატეგორიაში, ხელოსნის სახელსა და ნომერში..."
              aria-label="ძიება"
              className="w-full h-12 md:h-14 pl-11 pr-10 rounded-xl bg-white border border-gray-200 text-[13.5px] md:text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            />
            {inputValue && (
              <button type="button" onClick={() => setInputValue("")} aria-label="გასუფთავება"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted grid place-items-center">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Row 2 — category + city (open popups) */}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setCatOpen(true)} aria-label="აირჩიე კატეგორია"
              className={cn("h-12 md:h-14 px-4 rounded-xl text-left inline-flex items-center gap-2 transition border",
                categoryName ? "bg-primary/5 border-primary/30 hover:border-primary/50" : "bg-white border-gray-200 hover:border-gray-400")}>
              <LayoutGrid className={cn("h-4 w-4 shrink-0", categoryName ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[13.5px] font-medium truncate flex-1", categoryName ? "text-primary" : "text-gray-700")}>{categoryName ?? "ყველა კატეგორია"}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
            <button type="button" onClick={() => setCityOpen(true)} aria-label="აირჩიე ქალაქი"
              className={cn("h-12 md:h-14 px-4 rounded-xl text-left inline-flex items-center gap-2 transition border",
                cityName ? "bg-primary/5 border-primary/30 hover:border-primary/50" : "bg-white border-gray-200 hover:border-gray-400")}>
              <MapPin className={cn("h-4 w-4 shrink-0", cityName ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[13.5px] font-medium truncate flex-1", cityName ? "text-primary" : "text-gray-700")}>{cityName ?? "ყველა ქალაქი"}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          </div>

          {/* Row 3 — submit */}
          <button type="submit"
            className="w-full h-12 md:h-14 rounded-xl bg-primary hover:bg-primary-dark text-primary-foreground text-sm md:text-[15px] font-bold inline-flex items-center justify-center gap-2 transition">
            <Search className="h-4 w-4" />ძიება
          </button>

          {/* Active filters */}
          {hasActive && (
            <div className="mt-2 px-1.5 pt-2 border-t border-gray-100 flex items-center gap-2 flex-wrap">
              <span className="text-[10.5px] uppercase tracking-[0.14em] font-bold text-muted-foreground shrink-0">აქტიური ფილტრი:</span>
              {inputValue && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-foreground text-[11.5px] font-semibold">
                  „{inputValue.length > 22 ? inputValue.slice(0, 22) + "…" : inputValue}"
                  <button type="button" onClick={() => setInputValue("")} className="hover:text-foreground"><X className="h-3 w-3" /></button>
                </span>
              )}
              {categoryName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11.5px] font-semibold">
                  <LayoutGrid className="h-3 w-3" />{categoryName}
                  <button type="button" onClick={() => setSelectedCategory("all")}><X className="h-3 w-3" /></button>
                </span>
              )}
              {cityName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11.5px] font-semibold">
                  <MapPin className="h-3 w-3" />{cityName}
                  <button type="button" onClick={() => setSelectedCity("all")}><X className="h-3 w-3" /></button>
                </span>
              )}
              <button type="button" onClick={reset} className="ml-auto text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 font-semibold">გასუფთავება</button>
            </div>
          )}
        </div>

        {/* Popular shortcuts — single row, horizontal scroll on all sizes */}
        {popularExisting.length > 0 && (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="text-[10.5px] uppercase tracking-[0.14em] font-bold text-muted-foreground shrink-0">პოპულარული:</span>
            {popularExisting.map(p => {
              const active = categoryName === p;
              return (
                <button key={p} type="button" onClick={() => active ? setSelectedCategory("all") : pickCategoryByName(p)}
                  className={cn("shrink-0 whitespace-nowrap h-8 px-3 rounded-full border text-[11.5px] font-semibold transition",
                    active ? "bg-primary border-primary text-primary-foreground" : "bg-white border-gray-200 text-gray-700 hover:border-gray-400")}>
                  {p}
                </button>
              );
            })}
          </div>
        )}
      </form>

      {/* ═════════ CATEGORY SHEET ═════════ */}
      {catOpen && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => { setCatOpen(false); setCatFilter(""); }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()}
            className="relative w-full md:w-[70vw] md:max-w-[1100px] max-h-[80vh] md:max-h-[680px] rounded-t-2xl md:rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">
            <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0"><span className="h-1.5 w-10 rounded-full bg-gray-200" /></div>
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 shrink-0">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-muted-foreground">აირჩიე</div>
                <div className="text-[15px] font-bold text-foreground">კატეგორია</div>
              </div>
              <button type="button" onClick={() => { setCatOpen(false); setCatFilter(""); }} aria-label="დახურვა" className="ml-auto h-9 w-9 rounded-lg hover:bg-muted grid place-items-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="px-5 pt-4 pb-2 shrink-0">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input autoFocus type="text" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} placeholder="მოძებნე კატეგორია..."
                  className="w-full h-11 pl-10 pr-9 rounded-xl bg-muted/50 border border-gray-200 text-[13.5px] placeholder:text-muted-foreground focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-primary/20 transition" />
                {catFilter && <button type="button" onClick={() => setCatFilter("")} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-muted-foreground hover:bg-muted grid place-items-center"><X className="h-3.5 w-3.5" /></button>}
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-5 pb-5">
              <button type="button" onClick={() => { setSelectedCategory("all"); setCatOpen(false); setCatFilter(""); }}
                className={cn("mt-2 w-full flex items-center gap-3 px-3 h-12 rounded-xl border text-left transition", selectedCategory === "all" ? "bg-primary/5 border-primary/30" : "bg-white border-gray-200 hover:border-gray-300")}>
                <div className={cn("h-5 w-5 rounded-md border grid place-items-center shrink-0 transition", selectedCategory === "all" ? "border-primary bg-primary text-white" : "border-gray-300 bg-white")}>
                  {selectedCategory === "all" && <Check className="h-3 w-3" strokeWidth={3} />}
                </div>
                <LayoutGrid className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-[13.5px] font-bold text-foreground flex-1">ყველა კატეგორია</span>
                <span className="text-[10.5px] font-mono tabular-nums text-muted-foreground">{categories.length}</span>
              </button>

              {!catFilter && popularExisting.length > 0 && (
                <>
                  <div className="mt-5 mb-2 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-secondary" />
                    <span className="text-[10px] uppercase tracking-[0.16em] font-bold text-muted-foreground">პოპულარული</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {popularExisting.map(p => {
                      const active = categoryName === p;
                      return (
                        <button key={p} type="button" onClick={() => { pickCategoryByName(p); setCatOpen(false); setCatFilter(""); }}
                          className={cn("h-8 px-3 rounded-full border text-[11.5px] font-semibold transition", active ? "bg-primary border-primary text-primary-foreground" : "bg-white border-gray-200 text-gray-700 hover:border-gray-400")}>
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              <div className="mt-5 mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.16em] font-bold text-muted-foreground">{catFilter ? "შედეგი" : "ყველა კატეგორია"}</span>
                <span className="text-[10.5px] font-mono tabular-nums text-muted-foreground">{filteredCats.length}</span>
              </div>

              {filteredCats.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="text-[13px] font-semibold text-foreground">კატეგორია ვერ მოიძებნა</div>
                  <p className="mt-1 text-[12px] text-muted-foreground">სცადე სხვა სიტყვა.</p>
                </div>
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
                  {filteredCats.map(c => {
                    const active = selectedCategory === c.id.toString();
                    return (
                      <li key={c.id}>
                        <button type="button" onClick={() => { setSelectedCategory(c.id.toString()); setCatOpen(false); setCatFilter(""); }}
                          className={cn("w-full flex items-center gap-3 px-3.5 h-11 rounded-xl border text-left transition", active ? "bg-primary/5 border-primary/40 text-primary" : "bg-white border-gray-200 hover:bg-muted hover:border-gray-300")}>
                          <span className={cn("text-[13px] font-medium flex-1 truncate", !active && "text-foreground")}>{c.name}</span>
                          {active && <span className="h-4 w-4 rounded bg-primary text-white grid place-items-center shrink-0"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═════════ CITY SHEET ═════════ */}
      {cityOpen && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setCityOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()}
            className="relative w-full md:w-[70vw] md:max-w-[720px] rounded-t-2xl md:rounded-2xl bg-white shadow-2xl border border-gray-200 animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">
            <div className="md:hidden flex justify-center pt-2.5 pb-1"><span className="h-1.5 w-10 rounded-full bg-gray-200" /></div>
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-muted-foreground">აირჩიე</div>
                <div className="text-[15px] font-bold text-foreground">ქალაქი</div>
              </div>
              <button type="button" onClick={() => setCityOpen(false)} aria-label="დახურვა" className="ml-auto h-9 w-9 rounded-lg hover:bg-muted grid place-items-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5">
              <button type="button" onClick={() => { setSelectedCity("all"); setCityOpen(false); }}
                className={cn("w-full flex items-center gap-3 px-3 h-12 rounded-xl border text-left transition", selectedCity === "all" ? "bg-primary/5 border-primary/30" : "bg-white border-gray-200 hover:border-gray-300")}>
                <div className={cn("h-5 w-5 rounded-md border grid place-items-center shrink-0 transition", selectedCity === "all" ? "border-primary bg-primary text-white" : "border-gray-300 bg-white")}>
                  {selectedCity === "all" && <Check className="h-3 w-3" strokeWidth={3} />}
                </div>
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-[13.5px] font-bold text-foreground flex-1">ყველა ქალაქი</span>
                <span className="text-[10.5px] font-mono tabular-nums text-muted-foreground">{cities.length}</span>
              </button>
              <div className="mt-5 mb-2 text-[10px] uppercase tracking-[0.16em] font-bold text-muted-foreground">საქართველოს ქალაქები</div>
              <ul className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                {cities.map(c => {
                  const active = selectedCity === c;
                  return (
                    <li key={c}>
                      <button type="button" onClick={() => { setSelectedCity(c); setCityOpen(false); }}
                        className={cn("w-full flex items-center gap-2.5 px-3 h-11 rounded-xl border text-left transition", active ? "bg-primary/5 border-primary/40 text-primary" : "bg-white border-gray-200 hover:border-gray-400 text-foreground")}>
                        <MapPin className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                        <span className="text-[13px] font-semibold flex-1 truncate">{c}</span>
                        {active && <span className="h-4 w-4 rounded bg-primary text-white grid place-items-center shrink-0"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SimplifiedSearch;
