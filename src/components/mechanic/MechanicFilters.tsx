
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MechanicFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCity: string | null;
  setSelectedCity: (value: string | null) => void;
  cities: string[];
  selectedDistrict: string | null;
  setSelectedDistrict: (value: string | null) => void;
  districts: string[];
  selectedSpecialization: string | null;
  setSelectedSpecialization: (value: string | null) => void;
  mobileServiceOnly: boolean;
  setMobileServiceOnly: (value: boolean) => void;
  minRating: number | null;
  setMinRating: (value: number | null) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (value: boolean) => void;
  onSearch: () => void;
  onResetFilters: () => void;
}

const specializations = [
  "ავტომექანიკოსი",
  "ავტოელექტრიკოსი", 
  "კუზოვნი სამუშაოები",
  "საღებავი სამუშაოები",
  "საბურავების მონტაჟი",
  "მუყაო/ფრენები",
  "კონდიციონერი",
  "დიაგნოსტიკა",
  "ზეთის შეცვლა",
  "სხვა"
];

const MechanicFilters = ({
  searchTerm,
  setSearchTerm,
  selectedCity,
  setSelectedCity,
  cities,
  selectedDistrict,
  setSelectedDistrict,
  districts,
  selectedSpecialization,
  setSelectedSpecialization,
  mobileServiceOnly,
  setMobileServiceOnly,
  minRating,
  setMinRating,
  verifiedOnly,
  setVerifiedOnly,
  onSearch,
  onResetFilters,
}: MechanicFiltersProps) => {
  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="ძიება ხელოსნის სახელით, სპეციალიზაციით..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 border-2 border-gray-200 focus:border-primary transition-colors"
        />
      </div>

      {/* Location Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ქალაქი
          </label>
          <Select value={selectedCity || ""} onValueChange={(value) => setSelectedCity(value || null)}>
            <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-primary">
              <SelectValue placeholder="აირჩიეთ ქალაქი" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">ყველა ქალაქი</SelectItem>
              {cities.map(city => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCity === "თბილისი" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              უბანი
            </label>
            <Select value={selectedDistrict || ""} onValueChange={(value) => setSelectedDistrict(value || null)}>
              <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-primary">
                <SelectValue placeholder="აირჩიეთ უბანი" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ყველა უბანი</SelectItem>
                {districts.map(district => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Specialization and Rating */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            სპეციალიზაცია
          </label>
          <Select value={selectedSpecialization || ""} onValueChange={(value) => setSelectedSpecialization(value || null)}>
            <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-primary">
              <SelectValue placeholder="აირჩიეთ სპეციალიზაცია" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">ყველა სპეციალიზაცია</SelectItem>
              {specializations.map(specialization => (
                <SelectItem key={specialization} value={specialization}>
                  {specialization}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            მინიმალური რეიტინგი
          </label>
          <Select value={minRating?.toString() || ""} onValueChange={(value) => setMinRating(value ? parseInt(value) : null)}>
            <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-primary">
              <SelectValue placeholder="აირჩიეთ რეიტინგი" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">ყველა რეიტინგი</SelectItem>
              <SelectItem value="4">4+ ⭐</SelectItem>
              <SelectItem value="3">3+ ⭐</SelectItem>
              <SelectItem value="2">2+ ⭐</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Additional Filters */}
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="mobileService"
            checked={mobileServiceOnly}
            onCheckedChange={(checked) => setMobileServiceOnly(checked === true)}
          />
          <label htmlFor="mobileService" className="text-sm font-medium">
            ადგილზე მისვლის სერვისი
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="verified"
            checked={verifiedOnly}
            onCheckedChange={(checked) => setVerifiedOnly(checked === true)}
          />
          <label htmlFor="verified" className="text-sm font-medium">
            მხოლოდ ვერიფიცირებული
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          onClick={onSearch}
          className="flex-1 h-12 bg-primary hover:bg-primary-dark transition-colors font-semibold"
          size="lg"
        >
          <Search className="h-5 w-5 mr-2" />
          ძიება
        </Button>
        
        <Button 
          onClick={onResetFilters}
          variant="outline"
          className="h-12 px-8 border-2 border-gray-200 hover:bg-gray-50 transition-colors"
          size="lg"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          გასუფთავება
        </Button>
      </div>
    </div>
  );
};

export default MechanicFilters;
