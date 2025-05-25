
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
      <CardContent className="p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          {/* Main Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 md:h-5 w-4 md:w-5 text-muted-foreground" />
            <Input
              placeholder="ძიება სერვისში, კატეგორიაში, ხელოსნის სახელსა და ნომერში..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 md:pl-12 h-12 md:h-14 text-base md:text-lg border-2 border-primary/20 focus-visible:ring-primary"
            />
          </form>

          {/* Quick Filters - Mobile: Stacked, Desktop: Grid */}
          <div className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
              {/* Category */}
              <div className="space-y-2">
                <Label className="text-sm font-medium hidden md:block">კატეგორია</Label>
                <Select
                  value={selectedCategory.toString()}
                  onValueChange={(value) => setSelectedCategory(value === "all" ? "all" : parseInt(value))}
                >
                  <SelectTrigger className="h-11 md:h-12 border-primary/20 focus-visible:ring-primary">
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
                <Label className="text-sm font-medium hidden md:flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  ქალაქი
                </Label>
                <Select
                  value={selectedCity || "all"}
                  onValueChange={handleCityChange}
                >
                  <SelectTrigger className="h-11 md:h-12 border-primary/20 focus-visible:ring-primary">
                    <SelectValue placeholder="ქალაქი" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ყველა ქალაქი</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {city}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* District - only show if Tbilisi is selected */}
              {selectedCity === "თბილისი" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium hidden md:block">უბანი</Label>
                  <Select
                    value={selectedDistrict || "all"}
                    onValueChange={handleDistrictChange}
                  >
                    <SelectTrigger className="h-11 md:h-12 border-primary/20 focus-visible:ring-primary">
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

              {/* Rating */}
              <div className="space-y-2">
                <Label className="text-sm font-medium hidden md:flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  რეიტინგი
                </Label>
                <Select
                  value={minRating?.toString() || "all"}
                  onValueChange={(value) => setMinRating(value === "all" ? null : parseInt(value))}
                >
                  <SelectTrigger className="h-11 md:h-12 border-primary/20 focus-visible:ring-primary">
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

            {/* On-site service checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="on_site"
                checked={onSiteOnly}
                onCheckedChange={setOnSiteOnly}
              />
              <Label htmlFor="on_site" className="text-sm flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                ადგილზე მისვლა
              </Label>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="border-primary/20 hover:bg-primary/5"
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
                  className="text-muted-foreground hover:text-destructive border-destructive/20"
                >
                  <X className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">გასუფთავება</span>
                </Button>
              )}
            </div>

            {/* Advanced Filters Content */}
            <CollapsibleContent className="space-y-4 pt-4 border-t border-primary/10">
              {/* Car Brands */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Car className="h-4 w-4" />
                  მანქანის მარკები
                </Label>
                
                {/* Mobile: Show first 6 brands, then collapsible */}
                <div className="md:hidden space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {commonCarBrands.slice(0, 6).map(brand => (
                      <div key={brand} className="flex items-center space-x-2">
                        <Checkbox
                          id={`brand-${brand}`}
                          checked={selectedBrands.includes(brand)}
                          onCheckedChange={() => handleBrandToggle(brand)}
                        />
                        <Label htmlFor={`brand-${brand}`} className="text-sm">
                          {brand}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        მეტის ნახვა ({commonCarBrands.length - 6})
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        {commonCarBrands.slice(6).map(brand => (
                          <div key={brand} className="flex items-center space-x-2">
                            <Checkbox
                              id={`brand-${brand}`}
                              checked={selectedBrands.includes(brand)}
                              onCheckedChange={() => handleBrandToggle(brand)}
                            />
                            <Label htmlFor={`brand-${brand}`} className="text-sm">
                              {brand}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* Desktop: Show all brands in grid */}
                <div className="hidden md:grid grid-cols-6 gap-2">
                  {commonCarBrands.map(brand => (
                    <div key={brand} className="flex items-center space-x-2">
                      <Checkbox
                        id={`brand-${brand}`}
                        checked={selectedBrands.includes(brand)}
                        onCheckedChange={() => handleBrandToggle(brand)}
                      />
                      <Label htmlFor={`brand-${brand}`} className="text-sm">
                        {brand}
                      </Label>
                    </div>
                  ))}
                </div>
                
                {selectedBrands.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedBrands.map(brand => (
                      <Badge key={brand} variant="secondary" className="flex items-center gap-1">
                        {brand}
                        <button
                          onClick={() => handleBrandToggle(brand)}
                          className="text-muted-foreground hover:text-destructive"
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

          {/* Search Button */}
          <div className="flex gap-3">
            <Button 
              onClick={onSearch} 
              className="flex-1 h-12 md:h-14 text-base md:text-lg bg-primary hover:bg-primary-dark transition-colors"
            >
              <Search className="h-4 md:h-5 w-4 md:w-5 mr-2" />
              ძიება
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={onResetFilters}
                className="h-12 md:h-14 px-4 md:px-6 text-muted-foreground hover:text-destructive border-destructive/20"
              >
                <X className="h-4 md:h-5 w-4 md:w-5 mr-1 md:mr-2" />
                <span className="hidden sm:inline">გასუფთავება</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernServiceFilters;
