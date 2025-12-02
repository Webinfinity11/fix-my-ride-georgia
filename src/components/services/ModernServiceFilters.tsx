import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  MapPin, 
  Star, 
  Car, 
  X, 
  Check,
  MoreHorizontal,
  Wrench,
  Circle,
  Paintbrush,
  Zap,
  Fan,
  Truck,
  Droplets,
  Square,
  Hammer,
  Sparkles,
  Package,
  Settings,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
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
// კატეგორიების აიქონების მაპინგი
const categoryIcons: Record<string, LucideIcon> = {
  "ძრავის შეკეთება": Wrench,
  "ვულკანიზაცია": Circle,
  "სამღებრო სამუშაოები": Paintbrush,
  "ელექტროობა": Zap,
  "კონდინციონერი(ფრეონი)": Fan,
  "სავალი ნაწილის შეკეთება": Truck,
  "ზეთის შეცვლა": Droplets,
  "მინები": Square,
  "ტიუნინგი": Sparkles,
  "აკეცვა (სათუნუქე)": Hammer,
  "ნაწილების შეძენა": Package,
  "სხვა": Settings,
};
const ModernServiceFilters = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  selectedCity,
  setSelectedCity,
  cities,
  onSiteOnly,
  setOnSiteOnly,
  minRating,
  setMinRating,
  onSearch,
  onResetFilters,
}: ModernServiceFiltersProps) => {
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);
  // კატეგორიების ჩვენება
  const visibleCategories = showMoreCategories ? categories : categories.slice(0, 7);
  
  // ქალაქების ჩვენება
  const displayCities = showAllCities ? cities : cities.slice(0, 4);
  const hasMoreCities = cities.length > 4;

  const getCategoryIcon = (categoryName: string): LucideIcon => {
    return categoryIcons[categoryName] || Settings;
  };

  const getCategoryName = (categoryId: number | "all"): string => {
    if (categoryId === "all") return "";
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "";
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const hasActiveFilters =
    searchTerm ||
    selectedCategory !== "all" ||
    selectedCity ||
    onSiteOnly ||
    minRating;

  const removeFilter = (filterType: 'category' | 'city' | 'rating' | 'onsite') => {
    switch (filterType) {
      case 'category':
        setSelectedCategory("all");
        break;
      case 'city':
        setSelectedCity(null);
        break;
      case 'rating':
        setMinRating(null);
        break;
      case 'onsite':
        setOnSiteOnly(false);
        break;
    }
  };
  return (
    <Card className="border-border/20 shadow-lg bg-slate-50">
      <CardContent className="p-4 md:p-6">
        <div className="space-y-6">
          {/* კატეგორიების სექცია */}
          <div className="space-y-3">
            {/* მობაილზე: ჰორიზონტალური scroll */}
            <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              <div className="flex md:flex-wrap gap-2 md:gap-3 min-w-max md:min-w-0">
                {visibleCategories.map((category) => {
                  const Icon = getCategoryIcon(category.name);
                  const isSelected = selectedCategory === category.id;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(isSelected ? "all" : category.id)}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-2xl transition-all shrink-0",
                        "min-w-[90px] md:min-w-[110px] touch-manipulation active:scale-95",
                        isSelected 
                          ? "bg-slate-800 text-white shadow-lg" 
                          : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mb-2 transition-colors",
                        isSelected ? "bg-blue-500/20" : "bg-gray-50"
                      )}>
                        <Icon className={cn(
                          "w-6 h-6 md:w-7 md:h-7",
                          isSelected ? "text-blue-400" : "text-gray-400"
                        )} />
                      </div>
                      <span className="text-xs md:text-sm text-center leading-tight">{category.name}</span>
                    </button>
                  );
                })}
                
                {/* "სხვა" ღილაკი */}
                {categories.length > 7 && (
                  <button
                    onClick={() => setShowMoreCategories(!showMoreCategories)}
                    className="flex flex-col items-center p-3 rounded-2xl transition-all shrink-0 min-w-[90px] md:min-w-[110px] bg-white hover:bg-gray-50 border border-gray-200 touch-manipulation active:scale-95"
                  >
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mb-2 bg-gray-50">
                      <MoreHorizontal className="w-6 h-6 md:w-7 md:h-7 text-gray-400" />
                    </div>
                    <span className="text-xs md:text-sm text-gray-600">
                      {showMoreCategories ? "ნაკლები" : "სხვა"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* საძიებო ველი */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="ჩაწერეთ სერვისი ან ხელოსნის სახელი..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 rounded-xl border-gray-200 bg-white text-base placeholder:text-gray-400"
            />
          </form>

          {/* ლოკაცია და დამატებითი ფილტრები */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ლოკაცია */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-pink-500" />
                <span className="text-pink-500 text-sm font-medium">ლოკაცია</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCity(null)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm transition-all touch-manipulation active:scale-95",
                    !selectedCity
                      ? "bg-slate-800 text-white shadow-md"
                      : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
                  )}
                >
                  ყველა
                </button>
                {displayCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm transition-all touch-manipulation active:scale-95",
                      selectedCity === city
                        ? "bg-slate-800 text-white shadow-md"
                        : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
                    )}
                  >
                    {city}
                  </button>
                ))}
                {hasMoreCities && !showAllCities && (
                  <button
                    onClick={() => setShowAllCities(true)}
                    className="px-4 py-2 rounded-full text-sm bg-white border border-gray-200 hover:border-gray-300 text-gray-700 touch-manipulation active:scale-95"
                  >
                    + {cities.length - 4}
                  </button>
                )}
              </div>
            </div>

            {/* დამატებითი ფილტრები */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-yellow-600 text-sm font-medium">დამატებითი</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setMinRating(minRating === 4 ? null : 4)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm flex items-center gap-2 transition-all touch-manipulation active:scale-95",
                    minRating === 4
                      ? "bg-slate-800 text-white shadow-md"
                      : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
                  )}
                >
                  <Star className={cn("h-4 w-4", minRating === 4 ? "text-yellow-400" : "text-yellow-500")} />
                  მაღალი რეიტინგი
                </button>
                <button
                  onClick={() => setOnSiteOnly(!onSiteOnly)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm flex items-center gap-2 transition-all touch-manipulation active:scale-95",
                    onSiteOnly
                      ? "bg-slate-800 text-white shadow-md"
                      : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
                  )}
                >
                  <Car className={cn("h-4 w-4", onSiteOnly ? "text-blue-400" : "text-blue-500")} />
                  ადგილზე
                </button>
              </div>
            </div>
          </div>

          {/* არჩეული ფილტრები */}
          {hasActiveFilters && (
            <div className="flex items-start gap-2 flex-wrap bg-white p-4 rounded-xl border border-gray-200">
              <span className="text-sm text-gray-500 font-medium">არჩეული:</span>
              <div className="flex flex-wrap gap-2 flex-1">
                {selectedCategory !== "all" && (
                  <Badge className="flex items-center gap-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 px-3 py-1">
                    <Check className="h-3 w-3" />
                    {getCategoryName(selectedCategory)}
                    <button 
                      onClick={() => removeFilter('category')}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedCity && (
                  <Badge className="flex items-center gap-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 px-3 py-1">
                    <Check className="h-3 w-3" />
                    {selectedCity}
                    <button 
                      onClick={() => removeFilter('city')}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {minRating && (
                  <Badge className="flex items-center gap-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 px-3 py-1">
                    <Check className="h-3 w-3" />
                    {minRating}+ ვარსკვლავი
                    <button 
                      onClick={() => removeFilter('rating')}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {onSiteOnly && (
                  <Badge className="flex items-center gap-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 px-3 py-1">
                    <Check className="h-3 w-3" />
                    ადგილზე მისვლა
                    <button 
                      onClick={() => removeFilter('onsite')}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* ძიებისა და გასუფთავების ღილაკები */}
          <div className="flex gap-3">
            <Button
              onClick={onSearch}
              className="flex-1 h-14 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-base md:text-lg font-medium shadow-lg"
            >
              <Search className="h-5 w-5 mr-2" />
              ძიება
            </Button>
            {hasActiveFilters && (
              <Button
                onClick={onResetFilters}
                variant="outline"
                className="h-14 px-6 rounded-xl border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernServiceFilters;
