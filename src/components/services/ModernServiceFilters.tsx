import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Search, 
  MapPin, 
  Star, 
  Car, 
  Filter,
  X,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";

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
  "BMW", "Mercedes-Benz", "Audi", "Toyota", "Honda", "Nissan", "Hyundai", 
  "Kia", "Volkswagen", "Ford", "Chevrolet", "Mazda", "Subaru", "Lexus",
  "Infiniti", "Acura", "Jeep", "Land Rover", "Porsche", "Mitsubishi",
  "Opel", "Peugeot", "Renault", "Citroen", "Fiat", "Volvo", "Saab",
  "Skoda", "Seat", "Alfa Romeo", "Tesla", "სხვა"
];

// თბილისის უბნები
const tbilisiDistricts = [
  "ვაკე", "საბურთალო", "ვერე", "გლდანი", "ისანი", "ნაძალადევი",
  "ძველი თბილისი", "აბანოთუბანი", "ავლაბარი", "ჩუღურეთი", "სამგორი",
  "დიღომი", "ვაშლიჯვარი", "მთაწმინდა", "კრწანისი", "ავჭალა",
  "ლილო", "ორთაჭალა", "დიდუბე", "ფონიჭალა"
];

const ModernServiceFilters = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  selectedCity,
  setSelectedCity,
  cities,
  selectedDistrict,
  setSelectedDistrict,
  districts,
  selectedBrands,
  setSelectedBrands,
  onSiteOnly,
  setOnSiteOnly,
  minRating,
  setMinRating,
  onSearch,
  onResetFilters,
}: ModernServiceFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleBrandToggle = (brand: string) => {
    const newBrands = selectedBrands.includes(brand)
      ? selectedBrands.filter(b => b !== brand)
      : [...selectedBrands, brand];
    setSelectedBrands(newBrands);
  };

  const handleCityChange = (city: string) => {
    const newCity = city === "all" ? null : city;
    setSelectedCity(newCity);
    if (newCity !== "თბილისი") {
      setSelectedDistrict(null);
    }
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district === "all" ? null : district);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const hasActiveFilters = 
    searchTerm || 
    selectedCategory !== "all" || 
    selectedCity || 
    selectedDistrict || 
    selectedBrands.length > 0 || 
    onSiteOnly || 
    minRating;

  const activeFiltersCount = [
    searchTerm,
    selectedCategory !== "all",
    selectedCity,
    selectedDistrict,
    selectedBrands.length > 0,
    onSiteOnly,
    minRating
  ].filter(Boolean).length;

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardContent className="p-3 md:p-6">
        <div className="space-y-3 md:space-y-6">
          {/* Main Search Bar - Mobile Optimized */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 md:h-5 w-4 md:w-5 text-muted-foreground" />
            <Input
              placeholder="ძიება სერვისში, კატეგორიაში, ხელოსნის სახელსა და ნომერში..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 md:pl-12 h-11 md:h-14 text-sm md:text-lg border-2 border-primary/20 focus-visible:ring-primary"
            />
          </form>

          {/* Quick Filters - Fully Responsive */}
          <div className="space-y-3">
            {/* Mobile: Stack all filters vertically */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Category */}
              <div className="space-y-2">
                <Label className="text-xs md:text-sm font-medium text-gray-600">კატეგორია</Label>
                <Select
                  value={selectedCategory.toString()}
                  onValueChange={(value) => setSelectedCategory(value === "all" ? "all" : parseInt(value))}
                >
                  <SelectTrigger className="h-10 md:h-12 border-primary/20 focus-visible:ring-primary text-sm">
                    <SelectValue placeholder="კატეგორია" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ყველა კატეგორია</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label className="text-xs md:text-sm font-medium text-gray-600 flex items-center gap-1">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                  ქალაქი
                </Label>
                <Select
                  value={selectedCity || "all"}
                  onValueChange={handleCityChange}
                >
                  <SelectTrigger className="h-10 md:h-12 border-primary/20 focus-visible:ring-primary text-sm">
                    <SelectValue placeholder="ქალაქი" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ყველა ქალაქი</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                          {city}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* District - Mobile responsive */}
              {selectedCity === "თბილისი" && (
                <div className="space-y-2 col-span-1 sm:col-span-2 lg:col-span-1">
                  <Label className="text-xs md:text-sm font-medium text-gray-600">უბანი</Label>
                  <Select
                    value={selectedDistrict || "all"}
                    onValueChange={handleDistrictChange}
                  >
                    <SelectTrigger className="h-10 md:h-12 border-primary/20 focus-visible:ring-primary text-sm">
                      <SelectValue placeholder="უბანი" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ყველა უბანი</SelectItem>
                      {tbilisiDistricts.map(district => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Rating - Mobile friendly */}
              <div className="space-y-2">
                <Label className="text-xs md:text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Star className="h-3 w-3 md:h-4 md:w-4" />
                  რეიტინგი
                </Label>
                <Select
                  value={minRating?.toString() || "all"}
                  onValueChange={(value) => setMinRating(value === "all" ? null : parseInt(value))}
                >
                  <SelectTrigger className="h-10 md:h-12 border-primary/20 focus-visible:ring-primary text-sm">
                    <SelectValue placeholder="რეიტინგი" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ყველა რეიტინგი</SelectItem>
                    <SelectItem value="4">4+ ვარსკვლავი</SelectItem>
                    <SelectItem value="3">3+ ვარსკვლავი</SelectItem>
                    <SelectItem value="2">2+ ვარსკვლავი</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* On-site service checkbox - Touch friendly */}
            <div className="flex items-center space-x-3 py-2">
              <Checkbox
                id="on_site"
                checked={onSiteOnly}
                onCheckedChange={setOnSiteOnly}
                className="h-5 w-5"
              />
              <Label htmlFor="on_site" className="text-sm flex items-center gap-2 cursor-pointer">
                <CheckCircle className="h-4 w-4" />
                ადგილზე მისვლა
              </Label>
            </div>
          </div>

          {/* Advanced Filters Toggle - Mobile optimized */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="border-primary/20 hover:bg-primary/5 h-10 min-h-[44px] w-full sm:w-auto"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  დამატებითი ფილტრები
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                  {showAdvanced ? (
                    <ChevronUp className="h-4 w-4 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-2" />
                  )}
                </Button>
              </CollapsibleTrigger>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={onResetFilters}
                  size="sm"
                  className="text-muted-foreground hover:text-destructive border-destructive/20 h-10 min-h-[44px] w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-1" />
                  გასუფთავება
                </Button>
              )}
            </div>

            {/* Advanced Filters Content - Mobile responsive */}
            <CollapsibleContent className="space-y-4 pt-4 border-t border-primary/10">
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Car className="h-4 w-4" />
                  მანქანის მარკები
                </Label>
                
                {/* Mobile: Simplified brand selection */}
                <div className="space-y-3">
                  {/* First 6 brands always visible */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {commonCarBrands.slice(0, 6).map(brand => (
                      <div key={brand} className="flex items-center space-x-2 p-2 rounded border min-h-[44px]">
                        <Checkbox
                          id={`brand-${brand}`}
                          checked={selectedBrands.includes(brand)}
                          onCheckedChange={() => handleBrandToggle(brand)}
                          className="h-4 w-4"
                        />
                        <Label htmlFor={`brand-${brand}`} className="text-xs flex-1 cursor-pointer">
                          {brand}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  {/* More brands in collapsible */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full h-10 min-h-[44px]">
                        მეტის ნახვა ({commonCarBrands.length - 6})
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {commonCarBrands.slice(6).map(brand => (
                          <div key={brand} className="flex items-center space-x-2 p-2 rounded border min-h-[44px]">
                            <Checkbox
                              id={`brand-${brand}`}
                              checked={selectedBrands.includes(brand)}
                              onCheckedChange={() => handleBrandToggle(brand)}
                              className="h-4 w-4"
                            />
                            <Label htmlFor={`brand-${brand}`} className="text-xs flex-1 cursor-pointer">
                              {brand}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
                
                {/* Selected brands display */}
                {selectedBrands.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedBrands.map(brand => (
                      <Badge key={brand} variant="secondary" className="flex items-center gap-1 text-xs">
                        {brand}
                        <button
                          onClick={() => handleBrandToggle(brand)}
                          className="text-muted-foreground hover:text-destructive ml-1"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Search Button - Touch friendly */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={onSearch} 
              className="flex-1 h-12 md:h-14 text-sm md:text-lg bg-primary hover:bg-primary-dark transition-colors min-h-[44px]"
            >
              <Search className="h-4 md:h-5 w-4 md:w-5 mr-2" />
              ძიება
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={onResetFilters}
                className="h-12 md:h-14 px-4 md:px-6 text-muted-foreground hover:text-destructive border-destructive/20 min-h-[44px] sm:w-auto"
              >
                <X className="h-4 md:h-5 w-4 md:w-5 mr-1 md:mr-2" />
                გასუფთავება
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernServiceFilters;
