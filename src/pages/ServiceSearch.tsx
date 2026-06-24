import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search as SearchIcon, MapPin, SlidersHorizontal, X, Clock,
  CreditCard, Image as ImageIcon, Navigation, Loader2, Wrench,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ServiceCard from "@/components/services/ServiceCard";
import ServiceCardSkeleton from "@/components/services/ServiceCardSkeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose,
} from "@/components/ui/sheet";
import { VIPPlanType } from "@/hooks/useVIPRequests";

type ServiceType = {
  id: number;
  name: string;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  estimated_hours: number | null;
  city: string | null;
  district: string | null;
  address: string | null;
  car_brands: string[] | null;
  on_site_service: boolean;
  accepts_card_payment: boolean;
  accepts_cash_payment: boolean;
  rating: number | null;
  review_count: number | null;
  photos: string[] | null;
  slug?: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  working_days: string[] | null;
  working_hours_start: string | null;
  working_hours_end: string | null;
  vip_status: VIPPlanType | null;
  vip_until: string | null;
  is_vip_active: boolean;
  _distance?: number | null;
  category: { id: number; name: string } | null;
  mechanic: {
    id: string;
    first_name: string;
    last_name: string;
    rating: number | null;
    is_mobile: boolean;
    display_id?: number;
    phone_number?: string | null;
  };
};

type SortKey = "recommended" | "newest" | "price" | "rating" | "distance";

const SORT_LABELS: Record<SortKey, string> = {
  recommended: "რეკომენდებული",
  newest: "უახლესი",
  price: "ფასი (დაბლიდან)",
  rating: "რეიტინგი",
  distance: "მანძილი (ახლოს)",
};

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const POPULAR_BRANDS = [
  "Mercedes-Benz", "BMW", "Toyota", "Opel", "Volkswagen",
  "Ford", "Hyundai", "Kia", "Nissan", "Honda",
  "Lexus", "Audi", "Mitsubishi", "Mazda", "Subaru",
];

const isOpenNow = (s: ServiceType): boolean => {
  if (!s.working_days?.length || !s.working_hours_start || !s.working_hours_end) return false;
  const now = new Date();
  const day = DAY_KEYS[now.getDay()];
  if (!s.working_days.includes(day)) return false;
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

const ServiceSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // server-side filters
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    searchParams.get("category") ? Number(searchParams.get("category")) : null,
  );
  const [selectedCity, setSelectedCity] = useState<string | null>(searchParams.get("city") || null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  // client-side filters
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [openNow, setOpenNow] = useState(false);
  const [onSiteOnly, setOnSiteOnly] = useState(false);
  const [cardOnly, setCardOnly] = useState(false);
  const [withPhotos, setWithPhotos] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("recommended");
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // data
  const [rawServices, setRawServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // debounce search input -> searchQuery
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // keep URL shareable for the main server filters
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
      const { data: cats } = await supabase
        .from("service_categories").select("id, name").order("name");
      setCategories(cats || []);
      const { data: rows } = await supabase
        .from("mechanic_services").select("city").not("city", "is", null);
      setCities(Array.from(new Set((rows || []).map(r => r.city).filter(Boolean) as string[])).sort());
    } catch {
      toast.error("მონაცემების ჩატვირთვისას შეცდომა");
    }
  };

  const fetchDistricts = async () => {
    const { data } = await supabase
      .from("mechanic_services").select("district").eq("city", "თბილისი").not("district", "is", null);
    setDistricts(Array.from(new Set((data || []).map(r => r.district).filter(Boolean) as string[])).sort());
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("mechanic_services")
        .select(`
          id, name, description, price_from, price_to, estimated_hours,
          city, district, address, car_brands, on_site_service,
          accepts_card_payment, accepts_cash_payment, rating, review_count,
          photos, created_at, latitude, longitude,
          working_days, working_hours_start, working_hours_end,
          vip_status, vip_until, is_vip_active,
          service_categories(id, name),
          profiles!mechanic_id(id, first_name, last_name, phone, mechanic_profiles(display_id, rating, is_mobile))
        `)
        .eq("is_active", true);

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
          working_days: s.working_days, working_hours_start: s.working_hours_start,
          working_hours_end: s.working_hours_end,
          vip_status: (s.vip_status as VIPPlanType) || null,
          vip_until: s.vip_until, is_vip_active: !!s.is_vip_active,
          category: s.service_categories,
          mechanic: {
            id: profile?.id || "", first_name: profile?.first_name || "",
            last_name: profile?.last_name || "",
            rating: profile?.mechanic_profiles?.rating || null,
            is_mobile: profile?.mechanic_profiles?.is_mobile || false,
            display_id: profile?.mechanic_profiles?.display_id || undefined,
            phone_number: profile?.phone || null,
          },
        };
      });

      setRawServices(mapped);
      setVisibleCount(12);
    } catch (e) {
      console.error("Error fetching services:", e);
      toast.error("სერვისების ჩატვირთვისას შეცდომა");
    } finally {
      setLoading(false);
    }
  };

  // client-side filtering + sorting (instant, no refetch)
  const services = useMemo(() => {
    let list = rawServices.filter((s) => {
      if (openNow && !isOpenNow(s)) return false;
      if (onSiteOnly && !s.on_site_service) return false;
      if (cardOnly && !s.accepts_card_payment) return false;
      if (withPhotos && !(s.photos && s.photos.length > 0)) return false;
      if (selectedBrands.length > 0 && !(s.car_brands && selectedBrands.some(b => s.car_brands!.includes(b)))) return false;
      return true;
    });

    if (sortBy === "distance" && userLoc) {
      list = list.map(s => ({
        ...s,
        _distance: s.latitude != null && s.longitude != null
          ? distanceKm(userLoc.lat, userLoc.lng, s.latitude, s.longitude) : null,
      }));
    }

    const byVip = (a: ServiceType, b: ServiceType) => Number(b.is_vip_active) - Number(a.is_vip_active);
    const byNew = (a: ServiceType, b: ServiceType) => +new Date(b.created_at) - +new Date(a.created_at);

    const sorted = [...list].sort((a, b) => {
      switch (sortBy) {
        case "newest": return byNew(a, b);
        case "price": {
          const av = a.price_from, bv = b.price_from;
          if (av == null && bv == null) return byVip(a, b) || byNew(a, b);
          if (av == null) return 1;
          if (bv == null) return -1;
          return av - bv;
        }
        case "rating": {
          const av = a.rating ?? -1, bv = b.rating ?? -1;
          return bv - av || byNew(a, b);
        }
        case "distance": {
          const av = a._distance ?? Infinity, bv = b._distance ?? Infinity;
          return av - bv;
        }
        default: return byVip(a, b) || byNew(a, b); // recommended
      }
    });
    return sorted;
  }, [rawServices, openNow, onSiteOnly, cardOnly, withPhotos, selectedBrands, sortBy, userLoc]);

  const requestLocation = () => {
    if (!navigator.geolocation) { toast.error("ბრაუზერი არ უჭერს მხარს გეოლოკაციას"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setSortBy("distance"); setLocating(false); },
      () => { toast.error("მდებარეობის მიღება ვერ მოხერხდა"); setLocating(false); },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  const toggleBrand = (b: string) =>
    setSelectedBrands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);

  const resetAll = () => {
    setSearchInput(""); setSearchQuery(""); setSelectedCategory(null);
    setSelectedCity(null); setSelectedDistrict(null); setSelectedBrands([]);
    setOpenNow(false); setOnSiteOnly(false); setCardOnly(false); setWithPhotos(false);
    setSortBy("recommended"); setUserLoc(null);
  };

  const activeCount =
    (selectedCategory ? 1 : 0) + (selectedCity ? 1 : 0) + (selectedDistrict ? 1 : 0) +
    selectedBrands.length + (openNow ? 1 : 0) + (onSiteOnly ? 1 : 0) +
    (cardOnly ? 1 : 0) + (withPhotos ? 1 : 0);

  type Chip = { key: string; label: string; clear: () => void };
  const activeChips: Chip[] = useMemo(() => {
    const c: Chip[] = [];
    if (selectedCategory) c.push({ key: "cat", label: categories.find(x => x.id === selectedCategory)?.name || "კატეგორია", clear: () => setSelectedCategory(null) });
    if (selectedCity) c.push({ key: "city", label: selectedCity, clear: () => setSelectedCity(null) });
    if (selectedDistrict) c.push({ key: "dist", label: selectedDistrict, clear: () => setSelectedDistrict(null) });
    if (openNow) c.push({ key: "open", label: "ღიაა ახლა", clear: () => setOpenNow(false) });
    if (onSiteOnly) c.push({ key: "onsite", label: "ადგილზე მისვლა", clear: () => setOnSiteOnly(false) });
    if (cardOnly) c.push({ key: "card", label: "ბარათით", clear: () => setCardOnly(false) });
    if (withPhotos) c.push({ key: "photo", label: "ფოტოებით", clear: () => setWithPhotos(false) });
    selectedBrands.forEach(b => c.push({ key: "b-" + b, label: b, clear: () => toggleBrand(b) }));
    return c;
  }, [selectedCategory, selectedCity, selectedDistrict, openNow, onSiteOnly, cardOnly, withPhotos, selectedBrands, categories]);

  const QuickChip = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Clock; label: string }) => (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:bg-muted"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );

  // Full filter controls (used in desktop sidebar + mobile sheet)
  const FilterControls = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <label className="text-sm font-semibold mb-2 block">კატეგორია</label>
        <Select value={selectedCategory?.toString() || "all"} onValueChange={(v) => setSelectedCategory(v === "all" ? null : Number(v))}>
          <SelectTrigger><SelectValue placeholder="ყველა კატეგორია" /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">ყველა კატეგორია</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Location */}
      <div>
        <label className="text-sm font-semibold mb-2 block">მდებარეობა</label>
        <Select value={selectedCity || "all"} onValueChange={(v) => setSelectedCity(v === "all" ? null : v)}>
          <SelectTrigger><SelectValue placeholder="ყველა ქალაქი" /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">ყველა ქალაქი</SelectItem>
            {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        {selectedCity === "თბილისი" && districts.length > 0 && (
          <Select value={selectedDistrict || "all"} onValueChange={(v) => setSelectedDistrict(v === "all" ? null : v)}>
            <SelectTrigger className="mt-2"><SelectValue placeholder="ყველა უბანი" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">ყველა უბანი</SelectItem>
              {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button variant="outline" size="sm" className="mt-2 w-full" onClick={requestLocation} disabled={locating}>
          {locating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Navigation className="h-4 w-4 mr-2" />}
          {userLoc ? "მდებარეობა ჩართულია ✓" : "ჩემთან ახლოს"}
        </Button>
      </div>

      {/* Car brands */}
      <div>
        <label className="text-sm font-semibold mb-2 block">მანქანის მარკა</label>
        <div className="flex flex-wrap gap-2">
          {POPULAR_BRANDS.map(b => (
            <button
              key={b}
              onClick={() => toggleBrand(b)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                selectedBrands.includes(b) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:bg-muted"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Service attributes */}
      <div>
        <label className="text-sm font-semibold mb-2 block">სერვისი</label>
        <div className="flex flex-wrap gap-2">
          <QuickChip active={openNow} onClick={() => setOpenNow(v => !v)} icon={Clock} label="ღიაა ახლა" />
          <QuickChip active={onSiteOnly} onClick={() => setOnSiteOnly(v => !v)} icon={Navigation} label="ადგილზე მისვლა" />
          <QuickChip active={cardOnly} onClick={() => setCardOnly(v => !v)} icon={CreditCard} label="ბარათით" />
          <QuickChip active={withPhotos} onClick={() => setWithPhotos(v => !v)} icon={ImageIcon} label="ფოტოებით" />
        </div>
      </div>
    </div>
  );

  const total = services.length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-muted/40 py-6 md:py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-5 text-center">სერვისების ძიება</h1>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto relative mb-4">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ჩაწერეთ სერვისის სახელი ან აღწერა..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 h-12 bg-background"
            />
          </div>

          {/* Quick chips — horizontal scroll on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:justify-center">
            <QuickChip active={openNow} onClick={() => setOpenNow(v => !v)} icon={Clock} label="ღიაა ახლა" />
            <QuickChip active={onSiteOnly} onClick={() => setOnSiteOnly(v => !v)} icon={Navigation} label="ადგილზე მისვლა" />
            <QuickChip active={cardOnly} onClick={() => setCardOnly(v => !v)} icon={CreditCard} label="ბარათით" />
            <QuickChip active={withPhotos} onClick={() => setWithPhotos(v => !v)} icon={ImageIcon} label="ფოტოებით" />
          </div>

          <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">
            {/* Desktop sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 bg-background rounded-xl border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> ფილტრები</h2>
                  {activeCount > 0 && (
                    <button onClick={resetAll} className="text-xs text-primary hover:underline">გასუფთავება</button>
                  )}
                </div>
                <FilterControls />
              </div>
            </aside>

            {/* Results column */}
            <section>
              {/* Toolbar: count + mobile filter btn + sort */}
              <div className="flex items-center gap-2 mb-4">
                <p className="text-sm text-muted-foreground flex-1">
                  {loading ? "იტვირთება…" : <><span className="font-semibold text-foreground">{total}</span> სერვისი</>}
                </p>

                {/* Mobile filter trigger */}
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <SlidersHorizontal className="h-4 w-4 mr-1.5" />
                      ფილტრი{activeCount > 0 && <Badge className="ml-1.5 h-5 px-1.5">{activeCount}</Badge>}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[88%] sm:w-96 overflow-y-auto">
                    <SheetHeader className="mb-4"><SheetTitle>ფილტრები</SheetTitle></SheetHeader>
                    <FilterControls />
                    <SheetFooter className="mt-6 flex-row gap-2">
                      <Button variant="outline" className="flex-1" onClick={resetAll}>გასუფთავება</Button>
                      <SheetClose asChild><Button className="flex-1">ნახვა ({total})</Button></SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
                  <SelectTrigger className="w-auto min-w-[150px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
                      <SelectItem key={k} value={k} disabled={k === "distance" && !userLoc}>{SORT_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Active filter chips */}
              {activeChips.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {activeChips.map(chip => (
                    <button key={chip.key} onClick={chip.clear}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2.5 py-1 hover:bg-primary/20 transition-colors">
                      {chip.label}<X className="h-3 w-3" />
                    </button>
                  ))}
                  <button onClick={resetAll} className="text-xs text-muted-foreground hover:text-foreground underline px-1">
                    ყველას გასუფთავება
                  </button>
                </div>
              )}

              {/* Results grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[...Array(6)].map((_, i) => <ServiceCardSkeleton key={i} />)}
                </div>
              ) : total > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {services.slice(0, visibleCount).map((s, i) => (
                      <ServiceCard key={s.id} service={s} priorityImage={i < 3} />
                    ))}
                  </div>
                  {total > visibleCount && (
                    <div className="mt-8 text-center">
                      <Button variant="outline" size="lg" onClick={() => setVisibleCount(v => v + 12)}>
                        მეტის ჩვენება ({total - visibleCount})
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 bg-background rounded-xl border">
                  <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Wrench className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">სერვისი ვერ მოიძებნა</h3>
                  <p className="text-sm text-muted-foreground mb-4">სცადეთ ფილტრების შეცვლა ან გასუფთავება</p>
                  <Button variant="outline" onClick={resetAll}>ფილტრების გასუფთავება</Button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ServiceSearch;
