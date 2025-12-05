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
  Truck,
  Snowflake,
  Circle,
  Settings,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
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
  LayoutGrid,
  Navigation,
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
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
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

// Short names for categories
const categoryShortNames: Record<string, string> = {
  "ძრავის შეკეთება": "ძრავი",
  "ვულკანიზაცია": "საბურავი",
  "სამღებრო სამუშაოები": "საღებავი",
  "ელექტროობა": "ელექტრო",
  "კონდიცონერი (ფრეონი)": "კონდიც.",
  "კონდინციონერი(ფრეონი)": "კონდიც.",
  "სავალი ნაწილის შეკეთება": "სავალი",
  "ზეთის შეცვლა": "ზეთი",
  "საქარე მინები": "მინები",
  "სათუნუქე სამუშაოები": "სათუნუქე",
  "ფარების აღდგენა": "ფარები",
  "გადაცემათა კოლოფი": "კოლოფი",
  "მანქანის სალონი": "სალონი",
  "პლასმასის აღდგენა": "პლასტმასი",
  "გაზის სისტემის მონტაჟი/შეკეთება": "გაზი",
  "ჰიბრიდული სისტემა": "ჰიბრიდი",
  "გამონაბოლქვის სისტემა": "გამონაბოლქვი",
  "დინამოს და სტარტერის შეკეთება": "დინამო",
  "დისკების შეღებვა/აღდგენა": "დისკები",
  "კატალიზატორის სერვისი": "კატალიზატორი",
  "ვიზუალური დეტალები": "ვიზუალი",
  "მანქანის გასაღები": "გასაღები",
  "საღებავების შეზავება": "შეზავება",
  "აალების სანთლები": "სანთლები",
  "მინების დამუქება": "დამუქება",
  "ფირის გადაკვრა": "ფირი",
  "თვლების შეყრა": "შეყრა",
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
  const [showFilters, setShowFilters] = useState(false);

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
    return categoryIcons[categoryName] || Wrench;
  };

  const getCategoryShortName = (categoryName: string) => {
    return categoryShortNames[categoryName] || categoryName;
  };

  const getCategoryName = (categoryId: number | "all"): string => {
    if (categoryId === "all") return "ყველა";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "კატეგორია";
  };

  // Show first 12 when collapsed, all when expanded
  const visibleCategories = showMoreCategories ? sortedCategories : sortedCategories.slice(0, 12);

  const hasActiveFilters =
    searchTerm ||
    selectedCategory !== "all" ||
    selectedCity ||
    selectedBrand ||
    onSiteOnly ||
    minRating;

  const activeFilterCount = [
    searchTerm,
    selectedCategory !== "all",
    selectedCity,
    selectedBrand,
    onSiteOnly,
    minRating,
  ].filter(Boolean).length;

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
    <form onSubmit={handleSearchSubmit} className="space-y-4">
      {/* Categories Section - Always Visible */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-blue-500 font-medium">სერვისის კატეგორიები</span>
        </div>

        {/* Categories Grid */}
        <div className="overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:overflow-visible scrollbar-hide">
          <div className={cn(
            "flex gap-2 lg:gap-3",
            showMoreCategories ? "flex-wrap" : "lg:flex-wrap"
          )}>
            {visibleCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.name);
              const isSelected = selectedCategory === cat.id;
              const shortName = getCategoryShortName(cat.name);
              
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex flex-col items-center p-3 lg:p-4 rounded-2xl transition-all flex-shrink-0",
                    "min-w-[80px] lg:min-w-[100px]",
                    "border",
                    isSelected
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white hover:bg-gray-50 text-gray-600 border-gray-100"
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center mb-2 flex-shrink-0",
                      isSelected ? "bg-white/20" : "bg-gray-50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 lg:h-6 lg:w-6",
                        isSelected ? "text-white" : "text-gray-400"
                      )}
                    />
                  </div>
                  <span className="text-xs lg:text-sm text-center line-clamp-2 leading-tight">
                    {shortName}
                  </span>
                </button>
              );
            })}

            {/* "სხვა" / "აკეცვა" button - Blue style */}
            {sortedCategories.length > 12 && (
              <button
                type="button"
                onClick={() => setShowMoreCategories(!showMoreCategories)}
                className={cn(
                  "flex flex-col items-center p-3 lg:p-4 rounded-2xl transition-all flex-shrink-0",
                  "min-w-[80px] lg:min-w-[100px]",
                  "bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600"
                )}
              >
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center mb-2 bg-blue-100 flex-shrink-0">
                  {showMoreCategories ? (
                    <ChevronUp className="h-5 w-5 lg:h-6 lg:w-6 text-blue-500" />
                  ) : (
                    <MoreHorizontal className="h-5 w-5 lg:h-6 lg:w-6 text-blue-500" />
                  )}
                </div>
                <span className="text-xs lg:text-sm font-medium">
                  {showMoreCategories ? "აკეცვა" : `+${sortedCategories.length - 12} სხვა`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Trigger Button */}
      {!showFilters && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-all"
          >
            <span>დეტალური ძიება</span>
            {activeFilterCount > 0 && (
              <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Collapsible Filters Section */}
      {showFilters && (
        <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-200">
          {/* Filters Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-500 font-medium">ძიება და ფილტრები</span>
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm transition-colors"
            >
              აკეცვა
              <ChevronUp className="h-4 w-4" />
            </button>
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
                <span className="text-sm text-pink-500 font-medium">ლოკაცია</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-hide">
                {/* "ახლოს" button with navigation icon */}
                <button
                  type="button"
                  className="px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap flex items-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
                >
                  <Navigation className="h-3 w-3" />
                  ახლოს
                </button>
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
                  <span className="text-sm text-gray-500 font-medium">მარკა</span>
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

          {/* Active Filters - Outline Style Badges */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap bg-gray-50 p-3 rounded-xl">
              <span className="text-sm text-gray-500">ფილტრები:</span>

              {/* Category - Blue outline */}
              {selectedCategory !== "all" && (
                <Badge className="flex items-center gap-1 bg-transparent border border-blue-300 text-blue-600 hover:bg-blue-50">
                  <Check className="h-3 w-3" />
                  {getCategoryName(selectedCategory)}
                  <button
                    type="button"
                    onClick={() => removeFilter("category")}
                    className="ml-1 hover:bg-blue-100 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {/* City - Pink outline */}
              {selectedCity && (
                <Badge className="flex items-center gap-1 bg-transparent border border-pink-300 text-pink-600 hover:bg-pink-50">
                  <MapPin className="h-3 w-3" />
                  {selectedCity}
                  <button
                    type="button"
                    onClick={() => removeFilter("city")}
                    className="ml-1 hover:bg-pink-100 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {/* Brand - Gray outline */}
              {selectedBrand && (
                <Badge className="flex items-center gap-1 bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-100">
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

              {/* Rating - Yellow outline */}
              {minRating && (
                <Badge className="flex items-center gap-1 bg-transparent border border-yellow-400 text-yellow-600 hover:bg-yellow-50">
                  <Star className="h-3 w-3" />
                  რეიტინგული
                  <button
                    type="button"
                    onClick={() => removeFilter("rating")}
                    className="ml-1 hover:bg-yellow-100 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {/* On-Site - Green outline */}
              {onSiteOnly && (
                <Badge className="flex items-center gap-1 bg-transparent border border-green-400 text-green-600 hover:bg-green-50">
                  <Car className="h-3 w-3" />
                  ადგილზე
                  <button
                    type="button"
                    onClick={() => removeFilter("onSite")}
                    className="ml-1 hover:bg-green-100 rounded-full p-0.5"
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
        </div>
      )}
    </form>
  );
};

export default ModernServiceFilters;
