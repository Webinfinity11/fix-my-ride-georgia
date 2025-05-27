import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, MapPin, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type ServiceCategory = {
  id: number;
  name: string;
};

const SearchFilter = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch service categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("service_categories")
          .select("id, name")
          .order("name", { ascending: true });

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch cities from mechanic profiles
        const { data: mechanicsData, error: mechanicsError } = await supabase
          .from("profiles")
          .select("city")
          .eq("role", "mechanic")
          .not("city", "is", null);

        if (mechanicsError) throw mechanicsError;

        const uniqueCities = Array.from(
          new Set(mechanicsData?.map(m => m.city).filter(Boolean) as string[])
        ).sort();
        setCities(uniqueCities);
      } catch (error: any) {
        console.error("Error fetching filter data:", error);
        toast.error("მონაცემების ჩატვირთვისას შეცდომა დაფიქსირდა");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory) params.set("category", selectedCategory.toString());
    if (selectedCity) params.set("city", selectedCity);
    
    navigate(`/services?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (loading) {
    return (
      <section className="py-8 md:py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 animate-pulse">
              <div className="h-6 md:h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-6 md:mb-8"></div>
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4">მოძებნეთ სასურველი ხელოსანი</h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              გამოიყენეთ ჩვენი მოწინავე ძიების სისტემა, რომ მოძებნოთ თქვენი საჭიროებისთვის შესაფერისი ხელოსანი
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8">
            <div className="space-y-4">
              {/* Main Search Input - Always Visible */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ძიება სერვისში, კატეგორიაში, ხელოსნის სახელში..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 h-12 md:h-14 text-base border-2 border-gray-200 focus:border-primary transition-colors"
                />
              </div>

              {/* Mobile: Collapsible Advanced Filters */}
              <div className="md:hidden">
                <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full h-12 border-2 border-gray-200 transition-colors"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      დამატებითი ფილტრები
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    {/* Service Category Select */}
                    <Select value={selectedCategory?.toString() || ""} onValueChange={(value) => setSelectedCategory(value ? parseInt(value) : null)}>
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-primary transition-colors">
                        <SelectValue placeholder="აირჩიეთ სერვისი" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    {/* City Select */}
                    <Select value={selectedCity || ""} onValueChange={setSelectedCity}>
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-primary transition-colors">
                        <SelectValue placeholder="აირჩიეთ ქალაქი" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {cities.map(city => (
                            <SelectItem key={city} value={city}>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {city}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Desktop: Side-by-side Filters */}
              <div className="hidden md:grid md:grid-cols-2 gap-4">
                {/* Service Category Select */}
                <Select value={selectedCategory?.toString() || ""} onValueChange={(value) => setSelectedCategory(value ? parseInt(value) : null)}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-primary transition-colors">
                    <SelectValue placeholder="აირჩიეთ სერვისი" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {/* City Select */}
                <Select value={selectedCity || ""} onValueChange={setSelectedCity}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-primary transition-colors">
                    <SelectValue placeholder="აირჩიეთ ქალაქი" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {city}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button */}
              <Button 
                onClick={handleSearch}
                className="w-full h-12 md:h-14 bg-primary hover:bg-primary-dark transition-colors font-semibold text-base"
                size="lg"
              >
                <SearchIcon className="h-5 w-5 mr-2" />
                ძიება
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchFilter;
