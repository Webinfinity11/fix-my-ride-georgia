import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

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
  const [cityOpen, setCityOpen] = useState(false);

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
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger asChild>
            <Button
              id="city"
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={cityOpen}
              disabled={loadingCities}
              className={cn(
                "w-full justify-between border-primary/20 font-normal focus-visible:ring-primary",
                !selectedCity && "text-muted-foreground"
              )}
            >
              <span className="truncate">
                {loadingCities ? "იტვირთება..." : selectedCity || "აირჩიეთ ქალაქი"}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
          >
            <Command>
              <CommandInput placeholder="ქალაქის ძებნა..." />
              <CommandList>
                <CommandEmpty>ქალაქი ვერ მოიძებნა</CommandEmpty>
                {cities.map((city) => (
                  <CommandItem
                    key={city}
                    value={city}
                    className="mb-1 cursor-pointer rounded-md border border-border/60 px-3 py-2.5 last:mb-0"
                    onSelect={() => {
                      onCityChange(city);
                      setCityOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCity === city ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {city}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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
