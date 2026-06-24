import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search as SearchIcon, MapPin, X, Clock, CreditCard, Image as ImageIcon,
  Navigation, Loader2, Wrench, Check, ChevronsUpDown, Car, Layers,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ServiceCard from "@/components/services/ServiceCard";
import ServiceCardSkeleton from "@/components/services/ServiceCardSkeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { VIPPlanType } from "@/hooks/useVIPRequests";
import { CAR_BRAND_LOGOS, CAR_BRANDS_BY_POPULARITY } from "@/data/carBrandLogos";

const brandRank = (b: string) => {
  const i = CAR_BRANDS_BY_POPULARITY.indexOf(b);
  return i === -1 ? 999 : i;
};

type ServiceType = {
  id: number; name: string; description: string | null;
  price_from: number | null; price_to: number | null; estimated_hours: number | null;
  city: string | null; district: string | null; address: string | null;
  car_brands: string[] | null; on_site_service: boolean;
  accepts_card_payment: boolean; accepts_cash_payment: boolean;
  rating: number | null; review_count: number | null; photos: string[] | null;
  slug?: string | null; created_at: string;
  latitude: number | null; longitude: number | null;
  working_days: string[] | null; working_hours_start: string | null; working_hours_end: string | null;
  vip_status: VIPPlanType | null; vip_until: string | null; is_vip_active: boolean;
  _distance?: number | null;
  category: { id: number; name: string } | null;
  mechanic: {
    id: string; first_name: string; last_name: string;
    rating: number | null; is_mobile: boolean; display_id?: number; phone_number?: string | null;
  };
};

type SortKey = "recommended" | "newest" | "price" | "rating" | "distance";
const SORT_LABELS: Record<SortKey, string> = {
  recommended: "რეკომენდებული", newest: "უახლესი", price: "ფასი (დაბლიდან)",
  rating: "რეიტინგი", distance: "მანძილი (ახლოს)",
};
const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const isOpenNow = (s: ServiceType): boolean => {
  if (!s.working_days?.length || !s.working_hours_start || !s.working_hours_end) return false;
  const now = new Date();
  if (!s.working_days.includes(DAY_KEYS[now.getDay()])) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = s.working_hours_start.split(":").map(Number);
  const [eh, em] = s.working_hours_end.split(":").map(Number);
  return cur >= sh * 60 + sm && cur <= eh * 60 + em;
};
const distanceKm = (aLat: number, aLng: number, bLat: number, bLng: number): number => {
  const R = 6371, t = Math.PI / 180;
  const dLat = (bLat - aLat) * t, dLng = (bLng - aLng) * t;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * t) * Math.cos(bLat * t) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

/* ---- Generic single-select combobox (category, city) — unified style ---- */
const Combo = ({ value, options, onChange, placeholder, allLabel, icon: Icon }: {
  value: string | null; options: { value: string; label: string }[];
  onChange: (v: string | null) => void; placeholder: string; allLabel: string; icon: typeof Layers;
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const label = value ? options.find(o => o.value === value)?.label : null;
  const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase())) : options;
  const Row = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-left hover:bg-muted transition-colors", active && "font-medium")}>
      <Check className={cn("h-4 w-4 shrink-0 text-primary", active ? "opacity-100" : "opacity-0")} /><span className="truncate">{children}</span>
    </button>
  );
  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(""); }}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className={cn("h-11 w-full justify-between font-normal", !label && "text-muted-foreground")}>
          <span className="flex items-center gap-2 truncate"><Icon className="h-4 w-4 shrink-0 text-primary" />{label || placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[220px]" align="start">
        <div className="p-2 border-b">
          <div className="flex items-center gap-2 rounded-lg bg-muted h-9 px-2.5">
            <SearchIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="ძებნა..."
              className="flex-1 bg-transparent text-sm border-0 outline-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground" />
          </div>
        </div>
        <div className="max-h-[320px] overflow-y-auto p-1.5">
          <Row active={!value} onClick={() => { onChange(null); setOpen(false); }}>{allLabel}</Row>
          {filtered.map(o => <Row key={o.value} active={value === o.value} onClick={() => { onChange(o.value); setOpen(false); }}>{o.label}</Row>)}
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">ვერ მოიძებნა</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
};

/* ---- Brand picker with LOGOS (visual grid + search) ---- */
const BrandLogo = ({ brand, className }: { brand: string; className?: string }) => {
  const src = CAR_BRAND_LOGOS[brand];
  if (!src) return <Car className={cn("text-muted-foreground", className)} />;
  return <img src={src} alt={brand} loading="lazy" className={cn("object-contain", className)} />;
};

const BrandBox = ({ selected, options, onToggle, onClear }: {
  selected: string[]; options: string[]; onToggle: (b: string) => void; onClear: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const sorted = useMemo(() => [...options].sort((a, b) => brandRank(a) - brandRank(b)), [options]);
  const filtered = q ? sorted.filter(b => b.toLowerCase().includes(q.toLowerCase())) : sorted;
  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(""); }}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className={cn("h-11 w-full justify-between font-normal", selected.length === 0 && "text-muted-foreground")}>
          <span className="flex items-center gap-2 truncate">
            {selected.length === 1 ? <BrandLogo brand={selected[0]} className="h-5 w-5 shrink-0" /> : <Car className="h-4 w-4 shrink-0 text-primary" />}
            {selected.length === 0 ? "მანქანის მარკა" : selected.length === 1 ? selected[0] : `${selected.length} მარკა არჩეული`}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[min(94vw,520px)]" align="start">
        <div className="p-2 border-b flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg bg-muted h-9 px-2.5">
            <SearchIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="მარკის ძებნა..."
              className="flex-1 bg-transparent text-sm border-0 outline-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground" />
          </div>
          {selected.length > 0 && (
            <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground shrink-0 px-1.5">გასუფთავება ({selected.length})</button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2 grid grid-cols-2 gap-2">
          {filtered.map(b => {
            const active = selected.includes(b);
            return (
              <button key={b} onClick={() => onToggle(b)}
                className={cn("relative flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors",
                  active ? "border-primary bg-primary/5" : "border-border hover:bg-muted")}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white border">
                  <BrandLogo brand={b} className="h-8 w-8" />
                </span>
                <span className="text-sm font-medium flex-1 truncate">{b}</span>
                {active && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            );
          })}
          {filtered.length === 0 && <p className="col-span-full text-center text-sm text-muted-foreground py-6">ვერ მოიძებნა</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const Toggle = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Clock; label: string }) => (
  <button onClick={onClick} className={cn(
    "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
    active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:bg-muted",
  )}>
    <Icon className="h-3.5 w-3.5" />{label}
  </button>
);

const ServiceSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(searchParams.get("category") ? Number(searchParams.get("category")) : null);
  const [selectedCity, setSelectedCity] = useState<string | null>(searchParams.get("city") || null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [withPhotos, setWithPhotos] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [onSiteOnly, setOnSiteOnly] = useState(false);
  const [cardOnly, setCardOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("recommended");
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const [rawServices, setRawServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (searchQuery) p.set("q", searchQuery);
    if (selectedCategory) p.set("category", String(selectedCategory));
    if (selectedCity) p.set("city", selectedCity);
    setSearchParams(p, { replace: true });
  }, [searchQuery, selectedCategory, selectedCity, setSearchParams]);

  useEffect(() => { fetchInitialData(); }, []);
  useEffect(() => {
    if (selectedCity === "თბილისი") fetchDistricts();
    else { setDistricts([]); setSelectedDistrict(null); }
  }, [selectedCity]);
  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, selectedCity, selectedDistrict]);

  const fetchInitialData = async () => {
    try {
      const { data: cats } = await supabase.from("service_categories").select("id, name").order("name");
      setCategories(cats || []);
      const { data: rows } = await supabase.from("mechanic_services").select("city, car_brands").eq("is_active", true);
      setCities(Array.from(new Set((rows || []).map(r => r.city).filter(Boolean) as string[])).sort());
      const brands = new Set<string>();
      (rows || []).forEach(r => (r.car_brands || []).forEach((b: string) => brands.add(b)));
      setBrandOptions(Array.from(brands).sort());
    } catch { toast.error("მონაცემების ჩატვირთვისას შეცდომა"); }
  };

  const fetchDistricts = async () => {
    const { data } = await supabase.from("mechanic_services").select("district").eq("city", "თბილისი").not("district", "is", null);
    setDistricts(Array.from(new Set((data || []).map(r => r.district).filter(Boolean) as string[])).sort());
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      let query = supabase.from("mechanic_services").select(`
        id, name, description, price_from, price_to, estimated_hours,
        city, district, address, car_brands, on_site_service,
        accepts_card_payment, accepts_cash_payment, rating, review_count,
        photos, created_at, latitude, longitude,
        working_days, working_hours_start, working_hours_end,
        vip_status, vip_until, is_vip_active,
        service_categories(id, name),
        profiles!mechanic_id(id, first_name, last_name, phone, mechanic_profiles(display_id, rating, is_mobile))
      `).eq("is_active", true);

      if (searchQuery) query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      if (selectedCategory) query = query.eq("category_id", selectedCategory);
      if (selectedCity) query = query.eq("city", selectedCity);
      if (selectedDistrict) query = query.eq("district", selectedDistrict);

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;

      const mapped: ServiceType[] = (data || []).map((s) => {
        const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
        return {
          id: s.id, name: s.name, description: s.description,
          price_from: s.price_from, price_to: s.price_to, estimated_hours: s.estimated_hours,
          city: s.city, district: s.district, address: s.address,
          car_brands: s.car_brands, on_site_service: s.on_site_service,
          accepts_card_payment: s.accepts_card_payment, accepts_cash_payment: s.accepts_cash_payment,
          rating: s.rating, review_count: s.review_count, photos: s.photos || [],
          created_at: s.created_at, latitude: s.latitude, longitude: s.longitude,
          working_days: s.working_days, working_hours_start: s.working_hours_start, working_hours_end: s.working_hours_end,
          vip_status: (s.vip_status as VIPPlanType) || null, vip_until: s.vip_until, is_vip_active: !!s.is_vip_active,
          category: s.service_categories,
          mechanic: {
            id: profile?.id || "", first_name: profile?.first_name || "", last_name: profile?.last_name || "",
            rating: profile?.mechanic_profiles?.rating || null, is_mobile: profile?.mechanic_profiles?.is_mobile || false,
            display_id: profile?.mechanic_profiles?.display_id || undefined, phone_number: profile?.phone || null,
          },
        };
      });
      setRawServices(mapped);
      setVisibleCount(12);
    } catch (e) {
      console.error("Error fetching services:", e);
      toast.error("სერვისების ჩატვირთვისას შეცდომა");
    } finally { setLoading(false); }
  };

  const services = useMemo(() => {
    let list = rawServices.filter((s) => {
      if (withPhotos && !(s.photos && s.photos.length > 0)) return false;
      if (openNow && !isOpenNow(s)) return false;
      if (onSiteOnly && !s.on_site_service) return false;
      if (cardOnly && !s.accepts_card_payment) return false;
      if (selectedBrands.length > 0 && !(s.car_brands && selectedBrands.some(b => s.car_brands!.includes(b)))) return false;
      return true;
    });
    if (sortBy === "distance" && userLoc) {
      list = list.map(s => ({ ...s, _distance: s.latitude != null && s.longitude != null ? distanceKm(userLoc.lat, userLoc.lng, s.latitude, s.longitude) : null }));
    }
    const byVip = (a: ServiceType, b: ServiceType) => Number(b.is_vip_active) - Number(a.is_vip_active);
    const byNew = (a: ServiceType, b: ServiceType) => +new Date(b.created_at) - +new Date(a.created_at);
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "newest": return byNew(a, b);
        case "price": {
          const av = a.price_from, bv = b.price_from;
          if (av == null && bv == null) return byVip(a, b) || byNew(a, b);
          if (av == null) return 1; if (bv == null) return -1; return av - bv;
        }
        case "rating": return (b.rating ?? -1) - (a.rating ?? -1) || byNew(a, b);
        case "distance": return (a._distance ?? Infinity) - (b._distance ?? Infinity);
        default: return byVip(a, b) || byNew(a, b);
      }
    });
  }, [rawServices, withPhotos, openNow, onSiteOnly, cardOnly, selectedBrands, sortBy, userLoc]);

  const requestLocation = () => {
    if (!navigator.geolocation) { toast.error("ბრაუზერი არ უჭერს მხარს გეოლოკაციას"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setSortBy("distance"); setLocating(false); toast.success("მდებარეობა ჩაირთო"); },
      () => { toast.error("მდებარეობის მიღება ვერ მოხერხდა"); setLocating(false); },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  const toggleBrand = (b: string) => setSelectedBrands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  const resetAll = () => {
    setSearchInput(""); setSearchQuery(""); setSelectedCategory(null); setSelectedCity(null); setSelectedDistrict(null);
    setSelectedBrands([]); setWithPhotos(false); setOpenNow(false); setOnSiteOnly(false); setCardOnly(false);
    setSortBy("recommended"); setUserLoc(null);
  };

  type Chip = { key: string; label: string; logo?: string; clear: () => void };
  const activeChips: Chip[] = useMemo(() => {
    const c: Chip[] = [];
    if (selectedCategory) c.push({ key: "cat", label: categories.find(x => x.id === selectedCategory)?.name || "კატეგორია", clear: () => setSelectedCategory(null) });
    selectedBrands.forEach(b => c.push({ key: "b-" + b, label: b, logo: CAR_BRAND_LOGOS[b], clear: () => toggleBrand(b) }));
    if (selectedCity) c.push({ key: "city", label: selectedCity, clear: () => setSelectedCity(null) });
    if (selectedDistrict) c.push({ key: "dist", label: selectedDistrict, clear: () => setSelectedDistrict(null) });
    if (withPhotos) c.push({ key: "photo", label: "ფოტოებით", clear: () => setWithPhotos(false) });
    if (openNow) c.push({ key: "open", label: "ღიაა ახლა", clear: () => setOpenNow(false) });
    if (onSiteOnly) c.push({ key: "onsite", label: "ადგილზე მისვლა", clear: () => setOnSiteOnly(false) });
    if (cardOnly) c.push({ key: "card", label: "ბარათით", clear: () => setCardOnly(false) });
    return c;
  }, [selectedCategory, selectedBrands, selectedCity, selectedDistrict, withPhotos, openNow, onSiteOnly, cardOnly, categories]);

  const total = services.length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-muted/40 py-6 md:py-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-5 text-center">სერვისების ძიება</h1>

          {/* Search */}
          <div className="relative mb-3 max-w-2xl mx-auto">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="ჩაწერეთ სერვისის სახელი ან აღწერა..." value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)} className="pl-10 h-12 bg-background" />
          </div>

          {/* PRIMARY FILTERS — priority order: კატეგორია → ბრენდი → მდებარეობა → ფოტოები */}
          <div className="bg-background rounded-xl border p-3 md:p-4 mb-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <Combo value={selectedCategory?.toString() || null} options={categories.map(c => ({ value: c.id.toString(), label: c.name }))}
                onChange={(v) => setSelectedCategory(v ? Number(v) : null)} placeholder="კატეგორია" allLabel="ყველა კატეგორია" icon={Layers} />
              <BrandBox selected={selectedBrands} options={brandOptions} onToggle={toggleBrand} onClear={() => setSelectedBrands([])} />
              <Combo value={selectedCity} options={cities.map(c => ({ value: c, label: c }))}
                onChange={setSelectedCity} placeholder="მდებარეობა" allLabel="ყველა ქალაქი" icon={MapPin} />
              <button onClick={() => setWithPhotos(v => !v)} className={cn(
                "h-11 inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors",
                withPhotos ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:bg-muted",
              )}><ImageIcon className="h-4 w-4" />ფოტოებით</button>
            </div>

            {/* secondary row: district (when Tbilisi) + near me + toggles */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {selectedCity === "თბილისი" && districts.length > 0 && (
                <Select value={selectedDistrict || "all"} onValueChange={(v) => setSelectedDistrict(v === "all" ? null : v)}>
                  <SelectTrigger className="h-9 w-auto min-w-[140px]"><SelectValue placeholder="ყველა უბანი" /></SelectTrigger>
                  <SelectContent className="max-h-72"><SelectItem value="all">ყველა უბანი</SelectItem>{districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              )}
              <Button variant={userLoc ? "default" : "outline"} size="sm" onClick={requestLocation} disabled={locating} className="h-9">
                {locating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Navigation className="h-4 w-4 mr-1.5" />}
                {userLoc ? "ახლოს ✓" : "ჩემთან ახლოს"}
              </Button>
              <span className="hidden sm:block w-px h-5 bg-border mx-1" />
              <Toggle active={openNow} onClick={() => setOpenNow(v => !v)} icon={Clock} label="ღიაა ახლა" />
              <Toggle active={onSiteOnly} onClick={() => setOnSiteOnly(v => !v)} icon={Navigation} label="ადგილზე" />
              <Toggle active={cardOnly} onClick={() => setCardOnly(v => !v)} icon={CreditCard} label="ბარათით" />
            </div>
          </div>

          {/* Toolbar: count + sort */}
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm text-muted-foreground flex-1">
              {loading ? "იტვირთება…" : <><span className="font-semibold text-foreground">{total}</span> სერვისი</>}
            </p>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
              <SelectTrigger className="w-auto min-w-[150px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
                <SelectItem key={k} value={k} disabled={k === "distance" && !userLoc}>{SORT_LABELS[k]}</SelectItem>
              ))}</SelectContent>
            </Select>
          </div>

          {/* Active chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeChips.map(chip => (
                <button key={chip.key} onClick={chip.clear}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary text-xs pl-1.5 pr-2.5 py-1 hover:bg-primary/20 transition-colors">
                  {chip.logo && <img src={chip.logo} alt="" className="h-4 w-4 object-contain rounded-sm bg-white" />}
                  {chip.label}<X className="h-3 w-3" />
                </button>
              ))}
              <button onClick={resetAll} className="text-xs text-muted-foreground hover:text-foreground underline px-1">ყველას გასუფთავება</button>
            </div>
          )}

          {/* Results */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <ServiceCardSkeleton key={i} />)}
            </div>
          ) : total > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {services.slice(0, visibleCount).map((s, i) => <ServiceCard key={s.id} service={s} priorityImage={i < 3} />)}
              </div>
              {total > visibleCount && (
                <div className="mt-8 text-center">
                  <Button variant="outline" size="lg" onClick={() => setVisibleCount(v => v + 12)}>მეტის ჩვენება ({total - visibleCount})</Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-background rounded-xl border">
              <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4"><Wrench className="h-6 w-6 text-muted-foreground" /></div>
              <h3 className="font-semibold mb-1">სერვისი ვერ მოიძებნა</h3>
              <p className="text-sm text-muted-foreground mb-4">სცადეთ ფილტრების შეცვლა ან გასუფთავება</p>
              <Button variant="outline" onClick={resetAll}>ფილტრების გასუფთავება</Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ServiceSearch;
