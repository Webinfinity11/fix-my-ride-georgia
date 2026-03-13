import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Car, SlidersHorizontal, X, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

type ServiceCategory = {
  id: number;
  name: string;
  description?: string | null;
};

interface ModernServiceFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: number | "all";
  setSelectedCategory: (category: number | "all") => void;
  categories: ServiceCategory[];
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
  onResetFilters: () => void;
}

const commonCarBrands = [
  "BMW", "Mercedes-Benz", "Audi", "Toyota", "Honda", "Nissan",
  "Hyundai", "Kia", "Volkswagen", "Ford", "Chevrolet", "Mazda",
  "Subaru", "Lexus", "Infiniti", "Acura", "Jeep", "Land Rover",
  "Porsche", "Mitsubishi", "Opel", "Peugeot", "Renault", "Citroen",
  "Fiat", "Volvo", "Saab", "Skoda", "Seat", "Alfa Romeo", "Tesla", "სხვა",
];

const tbilisiDistricts = [
  "ვაკე", "საბურთალო", "ვერე", "გლდანი", "ისანი", "ნაძალადევი",
  "ძველი თბილისი", "აბანოთუბანი", "ავლაბარი", "ჩუღურეთი", "სამგორი",
  "დიღომი", "ვაშლიჯვარი", "მთაწმინდა", "კრწანისი", "ავჭალა",
  "ლილო", "ორთაჭალა", "დიდუბე", "ფონიჭალა",
];

const ModernServiceFilters = ({
  searchTerm, setSearchTerm,
  selectedCategory, setSelectedCategory, categories,
  selectedCity, setSelectedCity, cities,
  selectedDistrict, setSelectedDistrict, districts,
  selectedBrands, setSelectedBrands,
  onSiteOnly, setOnSiteOnly,
  minRating, setMinRating,
  onSearch, onResetFilters,
}: ModernServiceFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const isScrolling = useRef(false);

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(
      selectedBrands.includes(brand)
        ? selectedBrands.filter((b) => b !== brand)
        : [...selectedBrands, brand]
    );
  };

  const handleCityChange = (city: string) => {
    const newCity = city === "all" ? null : city;
    setSelectedCity(newCity);
    if (newCity !== "თბილისი") setSelectedDistrict(null);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
    setShowFilters(false);
  };

  const handleFilterSearch = () => {
    onSearch();
    setShowFilters(false);
  };

  const handleReset = () => {
    onResetFilters();
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
    selectedCategory !== "all" || selectedCity || selectedDistrict ||
    selectedBrands.length > 0 || onSiteOnly || minRating;

  const activeFiltersCount = [
    selectedCategory !== "all",
    selectedCity,
    selectedDistrict,
    selectedBrands.length > 0,
    onSiteOnly,
    minRating,
  ].filter(Boolean).length;

  // Collect active filter chips
  const activeFilterChips: { label: string; onRemove: () => void }[] = [];
  if (selectedCategory !== "all") {
    const cat = categories.find(c => c.id === selectedCategory);
    activeFilterChips.push({
      label: cat?.name || "კატეგორია",
      onRemove: () => setSelectedCategory("all"),
    });
  }
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
    <div className="space-y-2" style={{ touchAction: "pan-y" }}>
      {/* Always visible: Search bar with map button */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground"
            style={{ transform: "translateY(-50%)" }}
          />
          <Input
            placeholder="სერვისის ძიება..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 border-2 border-primary/20 focus-visible:ring-primary text-sm"
          />
        </div>
        <Button type="submit" className="h-10 px-4 shrink-0">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {/* Filter toggle button */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <Button
          variant="outline"
          onClick={handleFilterToggle}
          className="w-full h-10 border-primary/20 hover:bg-primary/5 justify-between"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            ფილტრები
            {activeFiltersCount > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0 h-5 min-w-5 flex items-center justify-center">
                {activeFiltersCount}
              </Badge>
            )}
          </span>
          {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
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
          className="space-y-4 border border-border rounded-xl p-4 bg-card animate-in slide-in-from-top-2 duration-200"
          style={{ touchAction: "pan-y" }}
        >
          {/* Category + City row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">კატეგორია</Label>
              <Select
                value={selectedCategory.toString()}
                onValueChange={(v) => setSelectedCategory(v === "all" ? "all" : parseInt(v))}
              >
                <SelectTrigger className="h-10 border-primary/20 text-sm" style={{ touchAction: "manipulation" }}>
                  <SelectValue placeholder="ყველა" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">ყველა კატეგორია</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> ქალაქი
              </Label>
              <Select value={selectedCity || "all"} onValueChange={handleCityChange}>
                <SelectTrigger className="h-10 border-primary/20 text-sm" style={{ touchAction: "manipulation" }}>
                  <SelectValue placeholder="ყველა" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">ყველა ქალაქი</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
                  {tbilisiDistricts.map((d) => (
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

          {/* Car brands */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Car className="h-3 w-3" /> მანქანის მარკა
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {(showAllBrands ? commonCarBrands : commonCarBrands.slice(0, 8)).map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleBrandToggle(brand)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedBrands.includes(brand)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {brand}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowAllBrands(!showAllBrands)}
                className="px-2.5 py-1 rounded-full text-xs font-medium text-primary border border-primary/30 hover:bg-primary/5"
              >
                {showAllBrands ? "ნაკლები ▲" : `+${commonCarBrands.length - 8} სხვა`}
              </button>
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
