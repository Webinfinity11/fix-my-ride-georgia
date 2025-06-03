
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LocationSelectorProps {
  selectedCity: string;
  selectedDistrict: string;
  onCityChange: (city: string) => void;
  onDistrictChange: (district: string) => void;
}

// საქართველოს 10 მთავარი ქალაქი
const georgianCities = [
  "თბილისი",
  "ბათუმი", 
  "ქუთაისი",
  "რუსთავი",
  "გორი",
  "ზუგდიდი",
  "ფოთი",
  "ხაშური",
  "სამტრედია",
  "ოზურგეთი"
];

// თბილისის უბნები
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
  "ფონიჭალა",
  "ვაზისუბანი",
  "ვარკეთილი"
];

const LocationSelector = ({ 
  selectedCity, 
  selectedDistrict, 
  onCityChange, 
  onDistrictChange 
}: LocationSelectorProps) => {
  const [showDistrict, setShowDistrict] = useState(false);

  useEffect(() => {
    setShowDistrict(selectedCity === "თბილისი");
    if (selectedCity !== "თბილისი") {
      onDistrictChange("");
    }
  }, [selectedCity, onDistrictChange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="city">ქალაქი *</Label>
        <Select value={selectedCity} onValueChange={onCityChange}>
          <SelectTrigger className="border-primary/20 focus-visible:ring-primary">
            <SelectValue placeholder="აირჩიეთ ქალაქი" />
          </SelectTrigger>
          <SelectContent>
            {georgianCities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showDistrict && (
        <div className="space-y-2">
          <Label htmlFor="district">უბანი</Label>
          <Select value={selectedDistrict} onValueChange={onDistrictChange}>
            <SelectTrigger className="border-primary/20 focus-visible:ring-primary">
              <SelectValue placeholder="აირჩიეთ უბანი" />
            </SelectTrigger>
            <SelectContent>
              {tbilisiDistricts.map((district) => (
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
