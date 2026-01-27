import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface LocationSelectorProps {
  selectedCity: string;
  selectedDistrict: string;
  onCityChange: (city: string) => void;
  onDistrictChange: (district: string) => void;
}

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
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);

  // Fetch cities from database
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { data, error } = await supabase
          .from("cities")
          .select("name")
          .order("name", { ascending: true });

        if (error) {
          console.error("Error fetching cities:", error);
          return;
        }

        const cityNames = data?.map(city => city.name) || [];
        setCities(cityNames);
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCities();
  }, []);

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
        <Select value={selectedCity} onValueChange={onCityChange} disabled={loadingCities}>
          <SelectTrigger className="border-primary/20 focus-visible:ring-primary">
            <SelectValue placeholder={loadingCities ? "იტვირთება..." : "აირჩიეთ ქალაქი"} />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
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
