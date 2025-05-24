
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type ServiceCategory = {
  id: number;
  name: string;
};

interface ServiceFiltersProps {
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

const allCarBrands = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Bugatti", 
  "Buick", "Cadillac", "Chevrolet", "Chrysler", "Citroën", "Daewoo", "Dacia",
  "Ferrari", "Fiat", "Ford", "Genesis", "GMC", "Honda", "Hyundai", "Infiniti",
  "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover", "Lexus", "Lincoln",
  "Maserati", "Mazda", "Mercedes-Benz", "Mini", "Mitsubishi", "Nissan", "Opel",
  "Peugeot", "Porsche", "Ram", "Renault", "Rolls-Royce", "Saab", "Seat", 
  "Skoda", "Smart", "Subaru", "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo"
];

const ServiceFilters = ({
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
  onResetFilters
}: ServiceFiltersProps) => {
  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(
      selectedBrands.includes(brand) 
        ? selectedBrands.filter(b => b !== brand)
        : [...selectedBrands, brand]
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="სერვისის ძიება..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 border-primary/20 focus-visible:ring-primary"
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
        
        <Select 
          value={selectedCategory.toString()} 
          onValueChange={(value) => setSelectedCategory(value === "all" ? "all" : parseInt(value))}
        >
          <SelectTrigger className="w-full sm:w-[200px] border-primary/20 focus-visible:ring-primary">
            <SelectValue placeholder="ყველა კატეგორია" />
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

        <Select value={selectedCity || ""} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="აირჩიეთ ქალაქი" />
          </SelectTrigger>
          <SelectContent>
            {cities.map(city => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedCity === "თბილისი" && (
          <Select value={selectedDistrict || ""} onValueChange={setSelectedDistrict}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="აირჩიეთ უბანი" />
            </SelectTrigger>
            <SelectContent>
              {districts.map(district => (
                <SelectItem key={district} value={district}>{district}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="onSiteService"
              checked={onSiteOnly}
              onCheckedChange={(checked) => setOnSiteOnly(checked === true)}
            />
            <label htmlFor="onSiteService" className="text-sm">ადგილზე მისვლის სერვისი</label>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm">მინიმალური რეიტინგი:</label>
            <Select value={minRating?.toString() || "all"} onValueChange={(value) => setMinRating(value === "all" ? null : parseInt(value))}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="ყველა" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ყველა</SelectItem>
                <SelectItem value="4">4+ ★</SelectItem>
                <SelectItem value="3">3+ ★</SelectItem>
                <SelectItem value="2">2+ ★</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">მანქანის მარკა:</label>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {allCarBrands.map(brand => (
              <Button
                key={brand}
                variant={selectedBrands.includes(brand) ? "default" : "outline"}
                size="sm"
                onClick={() => handleBrandToggle(brand)}
              >
                {brand}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onSearch} className="flex-1">
            <SearchIcon className="h-4 w-4 mr-2" />
            ძიება
          </Button>
          <Button variant="outline" onClick={onResetFilters}>
            გასუფთავება
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceFilters;
