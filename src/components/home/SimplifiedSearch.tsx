import { useState, useRef, useCallback, startTransition } from "react";
import { useNavigate } from "react-router-dom";
import { trackSearch } from "@/utils/tracking";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { Search, MapPin, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface ServiceCategory {
  id: number;
  name: string;
}

const SimplifiedSearch = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [dataFetched, setDataFetched] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const selectedCategoryLabel =
    selectedCategory === "all"
      ? "ყველა კატეგორია"
      : categories.find((c) => c.id.toString() === selectedCategory)?.name || "კატეგორია";

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchTerm(value);
    }, 150);
  }, []);

  const fetchData = useCallback(async () => {
    if (dataFetched) return;
    setDataFetched(true);
    startTransition(() => {
      (async () => {
        const [categoriesRes, citiesRes] = await Promise.all([
          supabase.from("service_categories").select("id, name").order("name"),
          supabase.from("mechanic_services").select("city").not("city", "is", null),
        ]);

        if (categoriesRes.data) {
          setCategories(categoriesRes.data);
        }

        if (citiesRes.data) {
          const uniqueCities = [...new Set(citiesRes.data.map((c) => c.city).filter(Boolean))] as string[];
          setCities(uniqueCities.sort());
        }
      })();
    });
  }, [dataFetched]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) trackSearch(searchTerm, "home");
    const params = new URLSearchParams();

    if (searchTerm) params.set("q", searchTerm);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedCity !== "all") params.set("city", selectedCity);

    navigate(`/services?${params.toString()}`);
  };

  return (
    <div className="w-full">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Main Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
           <Input
            placeholder="ძიება სერვისში, კატეგორიაში, ხელოსნის სახელსა და ნომერში..."
            value={inputValue}
            onChange={handleInputChange}
            onFocus={fetchData}
            className="pl-12 h-14 text-base md:text-lg border-2 border-primary/20 focus-visible:ring-primary rounded-xl bg-white"
          />
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {/* Category — searchable combobox (39 categories, type to filter) */}
          <Popover
            open={categoryOpen}
            onOpenChange={(open) => { setCategoryOpen(open); if (open) fetchData(); }}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={categoryOpen}
                className="h-12 w-full justify-between border-primary/20 bg-white rounded-lg font-normal px-3"
              >
                <span className={cn("truncate", selectedCategory === "all" && "text-muted-foreground")}>
                  {selectedCategoryLabel}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="კატეგორიის ძებნა..." />
                <CommandList>
                  <CommandEmpty>კატეგორია ვერ მოიძებნა</CommandEmpty>
                  <CommandItem
                    value="ყველა კატეგორია"
                    onSelect={() => { setSelectedCategory("all"); setCategoryOpen(false); }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", selectedCategory === "all" ? "opacity-100" : "opacity-0")} />
                    ყველა კატეგორია
                  </CommandItem>
                  {categories.map((cat) => (
                    <CommandItem
                      key={cat.id}
                      value={cat.name}
                      onSelect={() => { setSelectedCategory(cat.id.toString()); setCategoryOpen(false); }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", selectedCategory === cat.id.toString() ? "opacity-100" : "opacity-0")} />
                      {cat.name}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* City Select */}
          <Select value={selectedCity} onValueChange={setSelectedCity} onOpenChange={(open) => { if (open) fetchData(); }}>
            <SelectTrigger className="h-12 border-primary/20 bg-white rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="ქალაქი" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ყველა ქალაქი</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Button */}
        <Button
          type="submit"
          className="w-full h-12 bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl text-base font-semibold"
        >
          <Search className="h-5 w-5 mr-2" />
          ძიება
        </Button>
      </form>
    </div>
  );
};

export default SimplifiedSearch;
