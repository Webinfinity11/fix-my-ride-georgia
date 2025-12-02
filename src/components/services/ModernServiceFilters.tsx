import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MapPin,
  Star,
  Car,
  Wrench,
  Paintbrush,
  Zap,
  Droplets,
  Square,
  Hammer,
  Fan,
  Truck,
  Snowflake,
  Circle,
  Settings,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  Check,
  Activity,
  Droplet,
  Lightbulb,
  Cog,
  Armchair,
  Shield,
  Sparkles,
  Gauge,
  Sparkle,
  Flame,
  Package,
  Box,
  Layers,
  Fuel,
  Battery,
  Wind,
  CircleDot,
  BatteryCharging,
  RotateCw,
  ShoppingBag,
  Disc,
  GlassWater,
  Target,
  Filter,
  Eye,
  Key,
  DoorOpen,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ServiceCategory = {
  id: number;
  name: string;
  description?: string | null;
};

export interface ModernServiceFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: number | "all";
  setSelectedCategory: (category: number | "all") => void;
  categories: ServiceCategory[];
  selectedCity: string | null;
  setSelectedCity: (city: string | null) => void;
  cities: string[];
  selectedDistrict?: string | null;
  setSelectedDistrict?: (district: string | null) => void;
  districts?: string[];
  selectedBrand?: string | null;
  setSelectedBrand?: (brand: string | null) => void;
  carBrands?: string[];
  onSiteOnly: boolean;
  setOnSiteOnly: (value: boolean) => void;
  minRating: number | null;
  setMinRating: (rating: number | null) => void;
  onSearch: () => void;
  onResetFilters: () => void;
}

// Priority order based on popularity (from database statistics)
const categoryPriorityOrder = [13, 16, 11, 17, 27, 14, 21, 23, 12, 18, 20, 51, 26, 38, 28, 53, 29, 34, 22, 41, 33, 43, 19, 39, 25, 15, 40, 52, 49, 35, 30, 24, 36, 42, 37, 50, 31, 32, 54];

// Complete category icon mapping for all 39 categories
const categoryIcons: Record<string, any> = {
  "სავალი ნაწილის შეკეთება": Truck,
  "ელექტროობა": Zap,
  "ძრავის შეკეთება": Wrench,
  "დიაგნოსტიკა": Activity,
  "წყლის სისტემა": Droplets,
  "ზეთის შეცვლა": Droplet,
  "სათუნუქე სამუშაოები": Hammer,
  "ფარების აღდგენა": Lightbulb,
  "გადაცემათა კოლოფი": Cog,
  "მანქანის სალონი": Armchair,
  "სამღებრო სამუშაოები": Paintbrush,
  "აირბაგი": Shield,
  "ქიმწმენდა": Sparkles,
  "ტუნინგი": Gauge,
  "პოლირება": Sparkle,
  "აალების სანთლები": Flame,
  "მინების დამუქება": Square,
  "დაშლილები": Package,
  "პლასმასის აღდგენა": Box,
  "წვის სისტემა": Flame,
  "ფირის გადაკვრა": Layers,
  "გაზის სისტემის მონტაჟი/შეკეთება": Fuel,
  "ჰიბრიდული სისტემა": Battery,
  "გამონაბოლქვის სისტემა": Wind,
  "კონდიცონერი (ფრეონი)": Snowflake,
  "კონდინციონერი(ფრეონი)": Snowflake,
  "ვულკანიზაცია": Circle,
  "თვლების შეყრა": CircleDot,
  "აკუმულატორი": BatteryCharging,
  "დინამოს და სტარტერის შეკეთება": RotateCw,
  "ახალი ნაწილები": ShoppingBag,
  "დისკების შეღებვა/აღდგენა": Disc,
  "საქარე მინები": GlassWater,
  "საჭის სისტემა": Target,
  "კატალიზატორის სერვისი": Filter,
  "ვიზუალური დეტალები": Eye,
  "მანქანის გასაღები": Key,
  "კარის გაღება": DoorOpen,
  "საღებავების შეზავება": Palette,
  "დითეილინგი": Star,
};

const ModernServiceFilters: React.FC<ModernServiceFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  selectedCity,
  setSelectedCity,
  cities,
  selectedBrand,
  setSelectedBrand,
  carBrands = [],
  onSiteOnly,
  setOnSiteOnly,
  minRating,
  setMinRating,
  onSearch,
  onResetFilters,
}) => {
  const [showMoreCategories, setShowMoreCategories] = useState(false);

  // Sort categories by popularity
  const sortedCategories = React.useMemo(() => {
    return [...categories].sort((a, b) => {
      const aIndex = categoryPriorityOrder.indexOf(a.id);
      const bIndex = categoryPriorityOrder.indexOf(b.id);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [categories]);

  const getCategoryIcon = (categoryName: string) => {
    const IconComponent = categoryIcons[categoryName] || Wrench;
    return IconComponent;
  };

  const getCategoryName = (categoryId: number | "all"): string => {
    if (categoryId === "all") return "ყველა";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "კატეგორია";
  };

  const visibleCategories = showMoreCategories ? sortedCategories : sortedCategories.slice(0, 12);

  const hasActiveFilters =
    searchTerm ||
    selectedCategory !== "all" ||
    selectedCity ||
    selectedBrand ||
    onSiteOnly ||
    minRating;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const removeFilter = (filterType: string) => {
    switch (filterType) {
      case "category":
        setSelectedCategory("all");
        break;
      case "city":
        setSelectedCity(null);
        break;
      case "brand":
        if (setSelectedBrand) setSelectedBrand(null);
        break;
      case "rating":
        setMinRating(null);
        break;
      case "onSite":
        setOnSiteOnly(false);
        break;
    }
  };

  return (
    <form onSubmit={handleSearchSubmit} className="space-y-6">
      {/* კატეგორიები Section */}
      <div className="space-y-3">
        <span className="text-sm text-gray-500">კატეგორიები</span>
        
        {/* Mobile: 3-row horizontal scroll grid, Desktop: flex-wrap */}
        <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible scrollbar-hide">
          <div className={cn(
            "grid grid-rows-3 grid-flow-col auto-cols-max gap-2 snap-x snap-mandatory",
            "md:flex md:flex-wrap md:gap-3 md:snap-none"
          )}>
            {visibleCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.name);
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex flex-col items-center p-2 md:p-3 rounded-xl md:rounded-2xl transition-all snap-start",
                    "min-w-[70px] md:min-w-[90px]",
                    isSelected
                      ? "bg-slate-800 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-1 md:mb-2 flex-shrink-0",
                      isSelected ? "bg-blue-500/20" : "bg-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 md:h-5 md:w-5",
                        isSelected ? "text-blue-400" : "text-gray-400"
                      )}
                    />
                  </div>
                  <span className="text-[10px] md:text-xs text-center line-clamp-2 leading-tight">
                    {cat.name}
                  </span>
                </button>
              );
            })}

            {/* "სხვა" / "აკეცვა" button */}
            {sortedCategories.length > 12 && (
              <button
                type="button"
                onClick={() => setShowMoreCategories(!showMoreCategories)}
                className={cn(
                  "flex flex-col items-center p-2 md:p-3 rounded-xl md:rounded-2xl transition-all snap-start",
                  "min-w-[70px] md:min-w-[90px]",
                  "bg-gray-100 hover:bg-gray-200 text-gray-600"
                )}
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-1 md:mb-2 bg-white flex-shrink-0">
                  {showMoreCategories ? (
                    <ChevronUp className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                  ) : (
                    <MoreHorizontal className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                  )}
                </div>
                <span className="text-[10px] md:text-xs">{showMoreCategories ? "აკეცვა" : "სხვა"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Input + Rating/On-Site Buttons */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="ჩაწერეთ სერვისი ან ხელოსნის სახელი..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 rounded-xl border-gray-200 bg-white"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMinRating(minRating === 4 ? null : 4)}
            className={cn(
              "px-4 py-2 rounded-full text-sm flex items-center gap-2 whitespace-nowrap transition-all",
              minRating === 4
                ? "bg-slate-800 text-white"
                : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
            )}
          >
            <Star className={cn("h-4 w-4", minRating === 4 ? "fill-yellow-400 text-yellow-400" : "")} />
            რეიტინგული
          </button>
          <button
            type="button"
            onClick={() => setOnSiteOnly(!onSiteOnly)}
            className={cn(
              "px-4 py-2 rounded-full text-sm flex items-center gap-2 whitespace-nowrap transition-all",
              onSiteOnly
                ? "bg-slate-800 text-white"
                : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
            )}
          >
            <Car className="h-4 w-4" />
            ადგილზე
          </button>
        </div>
      </div>

      {/* Location + Brand in Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ლოკაცია */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-pink-500" />
            <span className="text-sm text-pink-500">ლოკაცია</span>
            <ChevronRight className="h-3 w-3 text-pink-500" />
          </div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-hide">
            <button
              type="button"
              onClick={() => setSelectedCity(null)}
              className={cn(
                "px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap",
                !selectedCity
                  ? "bg-slate-800 text-white"
                  : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
              )}
            >
              ყველა
            </button>
            {cities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap",
                  selectedCity === city
                    ? "bg-slate-800 text-white"
                    : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
                )}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* მარკა */}
        {setSelectedBrand && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">მარკა</span>
              <ChevronRight className="h-3 w-3 text-gray-500" />
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-hide">
              <button
                type="button"
                onClick={() => setSelectedBrand(null)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap",
                  !selectedBrand
                    ? "bg-slate-800 text-white"
                    : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
                )}
              >
                ყველა
              </button>
              {carBrands.slice(0, 12).map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setSelectedBrand(brand)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap",
                    selectedBrand === brand
                      ? "bg-slate-800 text-white"
                      : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
                  )}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active Filters - Colored Badges */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap bg-gray-50 p-3 rounded-xl">
          <span className="text-sm text-gray-500">ფილტრები:</span>

          {/* Category - Blue */}
          {selectedCategory !== "all" && (
            <Badge className="flex items-center gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
              <Check className="h-3 w-3" />
              {getCategoryName(selectedCategory)}
              <button
                type="button"
                onClick={() => removeFilter("category")}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {/* City - Pink */}
          {selectedCity && (
            <Badge className="flex items-center gap-1 bg-pink-100 text-pink-700 hover:bg-pink-200 border-0">
              <MapPin className="h-3 w-3" />
              {selectedCity}
              <button
                type="button"
                onClick={() => removeFilter("city")}
                className="ml-1 hover:bg-pink-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {/* Brand - Gray */}
          {selectedBrand && (
            <Badge className="flex items-center gap-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border-0">
              <Car className="h-3 w-3" />
              {selectedBrand}
              <button
                type="button"
                onClick={() => removeFilter("brand")}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {/* Rating - Yellow */}
          {minRating && (
            <Badge className="flex items-center gap-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-0">
              <Star className="h-3 w-3" />
              რეიტინგული
              <button
                type="button"
                onClick={() => removeFilter("rating")}
                className="ml-1 hover:bg-yellow-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {/* On-Site - Green */}
          {onSiteOnly && (
            <Badge className="flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200 border-0">
              <Car className="h-3 w-3" />
              ადგილზე
              <button
                type="button"
                onClick={() => removeFilter("onSite")}
                className="ml-1 hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {/* Clear All Button */}
          <button
            type="button"
            onClick={onResetFilters}
            className="ml-auto text-sm text-red-500 hover:text-red-600 font-medium"
          >
            გასუფთავება
          </button>
        </div>
      )}

      {/* Search Button */}
      <Button
        type="submit"
        className="w-full h-14 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-lg font-medium"
      >
        <Search className="h-5 w-5 mr-2" />
        ძიება
      </Button>
    </form>
  );
};

export default ModernServiceFilters;
