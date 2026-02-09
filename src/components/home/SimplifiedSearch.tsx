import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ServiceCategory {
  id: number;
  name: string;
}

interface SimplifiedSearchProps {
  onEvacuatorClick: () => void;
}

const SimplifiedSearch = ({ onEvacuatorClick }: SimplifiedSearchProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch categories and cities in parallel
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
    };

    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 text-base md:text-lg border-2 border-primary/20 focus-visible:ring-primary rounded-xl bg-white"
          />
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {/* Category Select */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-12 border-primary/20 bg-white rounded-lg">
              <SelectValue placeholder="კატეგორია" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ყველა კატეგორია</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* City Select */}
          <Select value={selectedCity} onValueChange={setSelectedCity}>
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

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="submit"
            className="flex-1 h-12 bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl text-base font-semibold"
          >
            <Search className="h-5 w-5 mr-2" />
            ძიება
          </Button>

          <Button
            type="button"
            onClick={onEvacuatorClick}
            variant="destructive"
            className="h-12 px-4 md:px-6 rounded-xl"
          >
            <Truck className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">ევაკუატორი</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SimplifiedSearch;
