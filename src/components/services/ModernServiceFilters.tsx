import { CAR_BRAND_LOGOS } from "@/data/carBrandLogos";
import { categoryNavigationSnapshot } from "@/lib/categoryNavigation";
import { createCategorySlug } from "@/utils/slugUtils";
import { cataloguePath } from "@/utils/catalogueNavigation";
import { useQuery } from "@tanstack/react-query";
import { availableServiceBrands } from "@/utils/availableServiceBrands";
import { locationCatalogueOptions } from "@/lib/locationCatalogue";
import { useParams } from "react-router-dom";
import { BRAND_PAGES } from "@/utils/carBrands";
import { getCityByName } from "@/utils/locationCatalogue";
import HorizontalFilterChoices from "@/components/services/HorizontalFilterChoices";
import CityFilter from "@/components/services/CityFilter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import CategoryNavigation from "@/components/services/CategoryNavigation";
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Star, SlidersHorizontal, X, CheckCircle } from "lucide-react";

interface ModernServiceFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: number | "all";
  // Retained for existing callers; category selection now uses crawlable links.
  setSelectedCategory?: (category: number | "all") => void;
  categories?: { id: number; name: string }[];
  selectedCity: string | null;
  setSelectedCity: (city: string | null) => void;
  cities: string[];
  selectedDistrict: string | null;
  setSelectedDistrict: (district: string | null) => void;
  districts: string[];
  selectedBrands: string[];
  setSelectedBrands: (brands: string[]) => void;
  onSiteOnly: boolean;
  setOnSiteOnly: (onSite: boolean) => void;
  minRating: number | null;
  setMinRating: (rating: number | null) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  onResetFilters: () => void;
}

const commonCarBrands = [
  "BMW", "Mercedes-Benz", "Audi", "Toyota", "Honda", "Nissan",
  "Hyundai", "Kia", "Volkswagen", "Ford", "Chevrolet", "Mazda",
  "Subaru", "Lexus", "Infiniti", "Acura", "Jeep", "Land Rover",
  "Porsche", "Mitsubishi", "Opel", "Peugeot", "Renault", "Citroen",
  "Fiat", "Volvo", "Saab", "Skoda", "Seat", "Alfa Romeo", "Tesla", "სხვა",
].filter(name => BRAND_PAGES.some(brand => brand.name === name));

const tbilisiDistricts = [
  "ვაკე", "საბურთალო", "ვერე", "გლდანი", "ისანი", "ნაძალადევი",
  "ძველი თბილისი", "აბანოთუბანი", "ავლაბარი", "ჩუღურეთი", "სამგორი",
  "დიღომი", "ვაშლიჯვარი", "მთაწმინდა", "კრწანისი", "ავჭალა",
  "ლილო", "ორთაჭალა", "დიდუბე", "ფონიჭალა",
];

const ModernServiceFilters = ({
  searchTerm, setSearchTerm,
  selectedCategory,
  selectedCity, setSelectedCity, cities,
  selectedDistrict, setSelectedDistrict, districts,
  selectedBrands, setSelectedBrands,
  onSiteOnly, setOnSiteOnly,
  minRating, setMinRating,
  onSearch, onClearSearch, onResetFilters,
}: ModernServiceFiltersProps) => {
  const { categorySlug: routeCategorySlug, brandSlug } = useParams();
  const categoryName = categoryNavigationSnapshot.find(item => item.id === selectedCategory)?.name;
  const categorySlug = routeCategorySlug || (categoryName ? createCategorySlug(categoryName) : undefined);
  const { data: locationInventory } = useQuery({ ...locationCatalogueOptions, enabled: selectedCategory !== 'all' || Boolean(selectedCity) });
  const availableCities = selectedCategory !== 'all' && locationInventory
    ? [...new Set(locationInventory.filter(row => row.category_id === selectedCategory).map(row => row.city?.trim()).filter((city): city is string => Boolean(city)))] : undefined;
  const constrainedBrands = selectedCategory !== 'all' || Boolean(selectedCity);
  const availableBrands = availableServiceBrands(locationInventory ?? [], selectedCategory, selectedCity);
  // Keep unavailable selections removable, but never offer empty intersections as new choices.
  const visibleBrands = [...new Set([
    ...commonCarBrands.filter(brand => !constrainedBrands || availableBrands.has(brand)),
    ...selectedBrands,
  ])];
  const cityLink = (name: string) => {
    const city = getCityByName(name);
    if (!city) return undefined;
    return cataloguePath({ categorySlug, citySlug: selectedCity === name ? undefined : city.slug, brands: selectedBrands });
  };
  const brandLink = (name: string) => {
    // Extra brand filters are buttons so crawlers cannot enumerate combinations.
    if (categorySlug || selectedCity) return undefined;
    const brand = BRAND_PAGES.find(item => item.name === name);
    if (!brand) return undefined;
    return brandSlug === brand.slug ? "/services" : `/brand/${brand.slug}`;
  };
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [appliedSearch, setAppliedSearch] = useState(searchTerm);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const touchStartY = useRef<number | null>(null);
  const isScrolling = useRef(false);

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(
      selectedBrands.includes(brand)
        ? selectedBrands.filter((b) => b !== brand)
        : [...selectedBrands, brand]
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchTerm.trim());
    onSearch();
    setShowSearch(false);
    setShowFilters(false);
  };

  const handleFilterSearch = () => {
    onSearch();
    setShowFilters(false);
  };

  const handleReset = () => {
    onResetFilters();
    setAppliedSearch("");
    setShowFilters(false);
  };

  // Touch scroll detection to prevent accidental filter opening
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isScrolling.current = false;
  }, []);

  const handleTouchMove = useCallback(() => {
    isScrolling.current = true;
  }, []);

  const handleFilterToggle = useCallback(() => {
    if (!isScrolling.current) {
      setShowFilters(prev => !prev);
    }
  }, []);

  const hasActiveFilters =
    appliedSearch || selectedCity || selectedDistrict ||
    selectedBrands.length > 0 || onSiteOnly || minRating;

  const activeFiltersCount = [
    selectedCity,
    selectedDistrict,
    selectedBrands.length > 0,
    onSiteOnly,
    minRating,
  ].filter(Boolean).length;

  // Collect active filter chips
  const activeFilterChips: { label: string; onRemove: () => void }[] = [];
  if (appliedSearch) activeFilterChips.push({ label: `ძიება: ${appliedSearch}`, onRemove: () => { setAppliedSearch(""); onClearSearch(); } });
  if (selectedCity) {
    activeFilterChips.push({ label: selectedCity, onRemove: () => { setSelectedCity(null); setSelectedDistrict(null); } });
  }
  if (selectedDistrict) {
    activeFilterChips.push({ label: selectedDistrict, onRemove: () => setSelectedDistrict(null) });
  }
  if (onSiteOnly) {
    activeFilterChips.push({ label: "ადგილზე მისვლა", onRemove: () => setOnSiteOnly(false) });
  }
  if (minRating) {
    activeFilterChips.push({ label: `${minRating}+ ★`, onRemove: () => setMinRating(null) });
  }
  selectedBrands.forEach(brand => {
    activeFilterChips.push({ label: brand, onRemove: () => handleBrandToggle(brand) });
  });

  return (
    <div className="space-y-3">
      <CategoryNavigation selectedCategory={selectedCategory} selectedCity={selectedCity} selectedBrands={selectedBrands} />
      <Dialog open={showSearch} onOpenChange={open => { setShowSearch(open); if (!open) setSearchTerm(appliedSearch); }}>
        <DialogContent className="max-w-lg" onCloseAutoFocus={event => { event.preventDefault(); searchTrigger.current?.focus(); }}>
          <DialogHeader><DialogTitle>სერვისის ძიება</DialogTitle><DialogDescription>ჩაწერეთ სერვისის ან ხელოსნის სახელი.</DialogDescription></DialogHeader>
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground"
            style={{ transform: "translateY(-50%)" }}
          />
          <Input
            autoFocus
            aria-label="სერვისის ძიება"
            placeholder="სერვისის ძიება..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 h-10 border-2 border-primary/20 focus-visible:ring-primary text-sm ${searchTerm ? "pr-9" : ""}`}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => { setAppliedSearch(""); onClearSearch(); }}
              aria-label="ძიების გასუფთავება"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" aria-label="ძებნა" className="h-10 px-4 shrink-0">
          <Search className="h-4 w-4" />
        </Button>
      </form>
        </DialogContent>
      </Dialog>
      <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
        <CityFilter availableCities={availableCities} getHref={cityLink} cities={cities} selectedCity={selectedCity} onChange={setSelectedCity} />
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 flex-1">
            <HorizontalFilterChoices getHref={brandLink} items={visibleBrands} renderItem={brand => CAR_BRAND_LOGOS[brand]
              ? <img src={CAR_BRAND_LOGOS[brand]} alt="" aria-hidden="true" width={56} height={36} className="h-9 w-14 max-w-none object-contain" />
              : <span className="text-xs">{brand}</span>} selected={selectedBrands} onToggle={handleBrandToggle} label="მანქანის მარკის არჩევა" previousLabel="წინა მარკები" nextLabel="შემდეგი მარკები" />
          </div>
          <Button ref={searchTrigger} type="button" size="icon" onClick={() => setShowSearch(true)} aria-label="სერვისის ძიების გახსნა" className="h-10 w-10 shrink-0"><Search className="h-4 w-4" /></Button>
          <div className="shrink-0" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleFilterToggle}
              aria-label="დამატებითი ფილტრები"
              title="დამატებითი ფილტრები"
              aria-expanded={showFilters}
              aria-controls="additional-service-filters"
              className="relative h-10 w-10 border-primary/20 hover:bg-primary/5"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFiltersCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{activeFiltersCount}</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Active filter chips - always visible when filters are collapsed */}
      {!showFilters && activeFilterChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeFilterChips.map((chip, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="flex items-center gap-1 text-xs py-0.5 px-2 bg-primary/10 text-primary"
            >
              {chip.label}
              <button
                onClick={chip.onRemove}
                className="ml-0.5 hover:text-destructive"
                aria-label={`${chip.label} წაშლა`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <button
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-destructive underline"
          >
            სულ გასუფთავება
          </button>
        </div>
      )}

      {/* Expandable filters panel */}
      {showFilters && (
        <div
          id="additional-service-filters"
          className="space-y-4 border border-border rounded-xl p-4 bg-card animate-in slide-in-from-top-2 duration-200"
          style={{ touchAction: "pan-y" }}
        >
          {/* District - only when Tbilisi selected */}
          {selectedCity === "თბილისი" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">უბანი</Label>
              <Select value={selectedDistrict || "all"} onValueChange={(v) => setSelectedDistrict(v === "all" ? null : v)}>
                <SelectTrigger className="h-10 border-primary/20 text-sm" style={{ touchAction: "manipulation" }}>
                  <SelectValue placeholder="ყველა უბანი" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">ყველა უბანი</SelectItem>
                  {(districts.length ? districts : tbilisiDistricts).map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Rating + On-site row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Star className="h-3 w-3" /> რეიტინგი
              </Label>
              <Select
                value={minRating?.toString() || "all"}
                onValueChange={(v) => setMinRating(v === "all" ? null : parseInt(v))}
              >
                <SelectTrigger className="h-10 border-primary/20 text-sm" style={{ touchAction: "manipulation" }}>
                  <SelectValue placeholder="ყველა" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">ყველა</SelectItem>
                  <SelectItem value="4">4+ ★</SelectItem>
                  <SelectItem value="3">3+ ★</SelectItem>
                  <SelectItem value="2">2+ ★</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end flex-1">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/50 cursor-pointer w-full h-10">
                <Checkbox
                  checked={onSiteOnly}
                  onCheckedChange={(v) => setOnSiteOnly(v === true)}
                  className="h-4 w-4"
                />
                <span className="text-sm flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  ადგილზე მისვლა
                </span>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <Button onClick={handleFilterSearch} className="flex-1 h-10">
              <Search className="h-4 w-4 mr-1.5" />
              გაფილტვრა
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleReset} className="h-10 px-3 text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernServiceFilters;
