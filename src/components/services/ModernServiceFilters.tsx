
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Filter, MapPin, Star, Car, CheckCircle } from "lucide-react";
import { ServiceCategory } from "@/hooks/useServices";

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

const popularCarBrands = [
  "Mercedes-Benz", "BMW", "Toyota", "Opel", "Volkswagen", 
  "Ford", "Hyundai", "Kia", "Nissan", "Honda"
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
    setSelectedBrands(
      selectedBrands.includes(brand)
        ? selectedBrands.filter(b => b !== brand)
        : [...selectedBrands, brand]
    );
  };

  const activeFiltersCount = [
    selectedCategory !== "all",
    selectedCity,
    selectedDistrict,
    selectedBrands.length > 0,
    onSiteOnly,
    minRating
  ].filter(Boolean).length;

  return (
    <Card className="mb-8 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardContent className="p-6">
        {/* Main Search */}
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="მოძებნეთ სერვისი, კატეგორია ან ხელოსანი..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg border-2 border-gray-200 focus:border-primary transition-colors rounded-xl"
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <Select value={selectedCity || "all-cities"} onValueChange={(value) => setSelectedCity(value === "all-cities" ? null : value)}>
                <SelectTrigger className="w-40 rounded-lg border-gray-200">
                  <SelectValue placeholder="ქალაქი" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-cities">ყველა ქალაქი</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCity === "თბილისი" && (
              <Select value={selectedDistrict || "all-districts"} onValueChange={(value) => setSelectedDistrict(value === "all-districts" ? null : value)}>
                <SelectTrigger className="w-40 rounded-lg border-gray-200">
                  <SelectValue placeholder="უბანი" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-districts">ყველა უბანი</SelectItem>
                  {districts.map(district => (
                    <SelectItem key={district} value={district}>{district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select 
              value={selectedCategory?.toString() || "all"} 
              onValueChange={(value) => setSelectedCategory(value === "all" ? "all" : parseInt(value))}
            >
              <SelectTrigger className="w-48 rounded-lg border-gray-200">
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

            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="rounded-lg border-gray-200 relative"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  დამატებითი ფილტრები
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 p-0 text-xs rounded-full bg-primary">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="onSiteService"
                      checked={onSiteOnly}
                      onCheckedChange={(checked) => setOnSiteOnly(checked === true)}
                    />
                    <label htmlFor="onSiteService" className="text-sm font-medium">
                      ადგილზე მისვლის სერვისი
                    </label>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      მინიმალური რეიტინგი
                    </label>
                    <Select 
                      value={minRating?.toString() || "all-ratings"} 
                      onValueChange={(value) => setMinRating(value === "all-ratings" ? null : parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="ყველა" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-ratings">ყველა</SelectItem>
                        <SelectItem value="4">4+ ★</SelectItem>
                        <SelectItem value="3">3+ ★</SelectItem>
                        <SelectItem value="2">2+ ★</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      მანქანის მარკა
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {popularCarBrands.map(brand => (
                        <div key={brand} className="flex items-center space-x-2">
                          <Checkbox
                            id={brand}
                            checked={selectedBrands.includes(brand)}
                            onCheckedChange={() => handleBrandToggle(brand)}
                          />
                          <label htmlFor={brand} className="text-xs">
                            {brand}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={onSearch} 
              className="px-8 py-2 rounded-lg bg-primary hover:bg-primary/90"
            >
              <Search className="h-4 w-4 mr-2" />
              ძიება
            </Button>
            <Button 
              variant="outline" 
              onClick={onResetFilters}
              className="px-6 py-2 rounded-lg border-gray-200"
            >
              გასუფთავება
            </Button>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
              <span className="text-sm text-muted-foreground">აქტიური ფილტრები:</span>
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="rounded-full">
                  {categories.find(c => c.id === selectedCategory)?.name}
                </Badge>
              )}
              {selectedCity && (
                <Badge variant="secondary" className="rounded-full">
                  {selectedCity}
                </Badge>
              )}
              {selectedDistrict && (
                <Badge variant="secondary" className="rounded-full">
                  {selectedDistrict}
                </Badge>
              )}
              {onSiteOnly && (
                <Badge variant="secondary" className="rounded-full">
                  ადგილზე მისვლა
                </Badge>
              )}
              {minRating && (
                <Badge variant="secondary" className="rounded-full">
                  {minRating}+ ★
                </Badge>
              )}
              {selectedBrands.map(brand => (
                <Badge key={brand} variant="secondary" className="rounded-full">
                  {brand}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernServiceFilters;
