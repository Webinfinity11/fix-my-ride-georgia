
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
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
  onClearSearch: () => void;
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
  onClearSearch,
}: MechanicFiltersProps) => {
  const handleCityChange = (value: string) => {
    if (value === "all") {
      setSelectedCity(null);
    } else {
      setSelectedCity(value);
    }
  };

  const handleDistrictChange = (value: string) => {
    if (value === "all") {
      setSelectedDistrict(null);
    } else {
      setSelectedDistrict(value);
    }
  };

  const handleSpecializationChange = (value: string) => {
    if (value === "all") {
      setSelectedSpecialization(null);
    } else {
      setSelectedSpecialization(value);
    }
  };

  const handleRatingChange = (value: string) => {
    if (value === "all") {
      setMinRating(null);
    } else {
      setMinRating(parseInt(value));
    }
  };

  const chip = (active: boolean) =>
    `h-10 rounded-full border px-4 text-sm font-medium transition-colors ${active ? "border-primary bg-primary text-white" : "border-gray-200 bg-white text-gray-700"}`;

  return (
    <div className="space-y-3">
      <form role="search" onSubmit={(e) => { e.preventDefault(); onSearch(); }} className="flex h-14 items-center gap-2 rounded-2xl border-2 border-primary/20 bg-white pl-4 pr-1.5 focus-within:border-primary">
        <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-gray-400" />
        <input
          type="text"
          enterKeyHint="search"
          aria-label="ხელოსნის ძიება"
          placeholder="სახელი ან სპეციალობა"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
        />
        {searchTerm && (
          <button type="button" aria-label="ძიების გასუფთავება" onClick={onClearSearch} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        )}
        <Button type="submit" className="h-11 shrink-0 rounded-xl px-5">ძებნა</Button>
      </form>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Select value={selectedCity || "all"} onValueChange={handleCityChange}>
          <SelectTrigger aria-label="ქალაქი" className="h-11 rounded-xl border-gray-200 bg-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა ქალაქი</SelectItem>
            {cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
          </SelectContent>
        </Select>
        {selectedCity === "თბილისი" && (
        <Select value={selectedDistrict || "all"} onValueChange={handleDistrictChange}>
          <SelectTrigger aria-label="უბანი" className="h-11 rounded-xl border-gray-200 bg-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა უბანი</SelectItem>
            {districts.map(district => <SelectItem key={district} value={district}>{district}</SelectItem>)}
          </SelectContent>
        </Select>
        )}
        <Select value={selectedSpecialization || "all"} onValueChange={handleSpecializationChange}>
          <SelectTrigger aria-label="სპეციალობა" className="h-11 rounded-xl border-gray-200 bg-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა სფერო</SelectItem>
            {specializations.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={minRating?.toString() || "all"} onValueChange={handleRatingChange}>
          <SelectTrigger aria-label="რეიტინგი" className="h-11 rounded-xl border-gray-200 bg-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა რეიტინგი</SelectItem>
            <SelectItem value="4">4+ ⭐</SelectItem>
            <SelectItem value="3">3+ ⭐</SelectItem>
            <SelectItem value="2">2+ ⭐</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={mobileServiceOnly} onClick={() => setMobileServiceOnly(!mobileServiceOnly)} className={chip(mobileServiceOnly)}>ადგილზე მისვლა</button>
        <button type="button" aria-pressed={verifiedOnly} onClick={() => setVerifiedOnly(!verifiedOnly)} className={chip(verifiedOnly)}>ვერიფიცირებული</button>
      </div>
    </div>
  );
};

export default MechanicFilters;
