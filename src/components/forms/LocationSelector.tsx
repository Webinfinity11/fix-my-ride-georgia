
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface LocationSelectorProps {
  selectedCity: string;
  selectedDistrict: string;
  onCityChange: (city: string) => void;
  onDistrictChange: (district: string) => void;
}

const georgianCities = [
  "თბილისი",
  "ქუთაისი", 
  "ბათუმი",
  "რუსთავი",
  "გორი",
  "ზუგდიდი",
  "ფოთი",
  "კობულეთი",
  "ხაშური",
  "სამტრედია"
];

const tbilisiDistricts = [
  "ვაკე",
  "საბურთალო",
  "ვერე",
  "გლდანი",
  "ისანი",
  "ნაძალადევი",
  "ძველი თბილისი",
  "აბანოთუბანი",
  "ავლაბარი",
  "ჩუღურეთი",
  "სამგორი",
  "დიღომი",
  "ვაშლიჯვარი",
  "მთაწმინდა",
  "კრწანისი",
  "ავჭალა",
  "ლილო",
  "ორთაჭალა",
  "დიდუბე",
  "ფონიჭალა"
];

const LocationSelector = ({ selectedCity, selectedDistrict, onCityChange, onDistrictChange }: LocationSelectorProps) => {
  const [citySearch, setCitySearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");

  const filteredCities = georgianCities.filter(city => 
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const filteredDistricts = tbilisiDistricts.filter(district => 
    district.toLowerCase().includes(districtSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base">ქალაქი</Label>
        <Select value={selectedCity} onValueChange={onCityChange}>
          <SelectTrigger className="border-primary/20 focus-visible:ring-primary">
            <SelectValue placeholder="აირჩიეთ ქალაქი" />
          </SelectTrigger>
          <SelectContent>
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ძიება..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            {filteredCities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCity === "თბილისი" && (
        <div className="space-y-2">
          <Label className="text-base">უბანი</Label>
          <Select value={selectedDistrict} onValueChange={onDistrictChange}>
            <SelectTrigger className="border-primary/20 focus-visible:ring-primary">
              <SelectValue placeholder="აირჩიეთ უბანი" />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ძიება..."
                    value={districtSearch}
                    onChange={(e) => setDistrictSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              {filteredDistricts.map((district) => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
