
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import MechanicCard from "@/components/mechanic/MechanicCard";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type MechanicType = {
  id: string;
  profile: {
    first_name: string;
    last_name: string;
    city: string;
    district: string;
  };
  mechanic_profile: {
    description: string | null;
    specialization: string | null;
    experience_years: number | null;
    rating: number | null;
    review_count: number | null; 
    is_mobile: boolean;
  };
  services: {
    id: number;
    name: string;
    category_id: number;
  }[];
};

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [mechanics, setMechanics] = useState<MechanicType[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceCategories, setServiceCategories] = useState<{id: number, name: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [visibleMechanicsCount, setVisibleMechanicsCount] = useState(6);
  const [activeTab, setActiveTab] = useState("all");

  // Load initial category from URL if present
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    if (categoryFromUrl) {
      setSelectedCategory(parseInt(categoryFromUrl));
    }
    
    const cityFromUrl = searchParams.get("city");
    if (cityFromUrl) {
      setSelectedCity(cityFromUrl);
    }
    
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch service categories for filtering
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("service_categories")
          .select("id, name")
          .order("name", { ascending: true });

        if (categoriesError) throw categoriesError;
        setServiceCategories(categoriesData || []);

        // Fetch mechanics with profile data
        await fetchMechanics();
      } catch (error: any) {
        console.error("Error fetching initial data:", error);
        toast.error("მონაცემების ჩატვირთვისას შეცდომა დაფიქსირდა");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Re-fetch when URL params change
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    const cityFromUrl = searchParams.get("city");
    const queryFromUrl = searchParams.get("q");
    
    fetchMechanics(
      queryFromUrl || "", 
      categoryFromUrl ? parseInt(categoryFromUrl) : null,
      cityFromUrl || null
    );
  }, [searchParams, activeTab]);

  const fetchMechanics = async (query: string = "", categoryId: number | null = null, city: string | null = null) => {
    try {
      console.log("Fetching mechanics with filters:", { query, categoryId, city, activeTab });
      
      // First get mechanics with their profile info
      const { data: mechanicsData, error: mechanicsError } = await supabase
        .from("profiles")
        .select(`
          id,
          first_name,
          last_name,
          city,
          district,
          mechanic_profiles!inner(description, specialization, experience_years, rating, review_count, is_mobile)
        `)
        .eq("role", "mechanic");

      if (mechanicsError) throw mechanicsError;

      // Extract unique cities for the filter
      const uniqueCities = Array.from(
        new Set(mechanicsData?.map(m => m.city).filter(Boolean) as string[])
      ).sort();
      setCities(uniqueCities);

      // For each mechanic, get their services
      const mechanicsWithServices = await Promise.all((mechanicsData || []).map(async (mechanic) => {
        const { data: services, error: servicesError } = await supabase
          .from("mechanic_services")
          .select("id, name, category_id")
          .eq("mechanic_id", mechanic.id)
          .eq("is_active", true);
          
        if (servicesError) throw servicesError;
          
        return {
          id: mechanic.id,
          profile: {
            first_name: mechanic.first_name,
            last_name: mechanic.last_name,
            city: mechanic.city,
            district: mechanic.district
          },
          mechanic_profile: mechanic.mechanic_profiles,
          services: services || []
        };
      }));
      
      // Filter by search query if provided
      let filteredMechanics = mechanicsWithServices;
      
      if (query) {
        const lowerQuery = query.toLowerCase();
        filteredMechanics = filteredMechanics.filter(mechanic => 
          mechanic.profile.first_name.toLowerCase().includes(lowerQuery) ||
          mechanic.profile.last_name.toLowerCase().includes(lowerQuery) ||
          (mechanic.mechanic_profile.specialization && 
           mechanic.mechanic_profile.specialization.toLowerCase().includes(lowerQuery)) ||
          mechanic.services.some(service => service.name.toLowerCase().includes(lowerQuery))
        );
      }
      
      // Filter by category if provided
      if (categoryId) {
        console.log("Filtering by category:", categoryId);
        filteredMechanics = filteredMechanics.filter(mechanic => 
          mechanic.services.some(service => service.category_id === categoryId)
        );
        console.log("Mechanics after category filter:", filteredMechanics.length);
      }

      // Filter by city if provided
      if (city) {
        console.log("Filtering by city:", city);
        filteredMechanics = filteredMechanics.filter(mechanic => 
          mechanic.profile.city === city
        );
      }

      // Filter by tab selection
      if (activeTab === "mobile") {
        filteredMechanics = filteredMechanics.filter(mechanic => 
          mechanic.mechanic_profile.is_mobile === true
        );
      } else if (activeTab === "top_rated") {
        filteredMechanics = filteredMechanics
          .filter(mechanic => mechanic.mechanic_profile.rating !== null && mechanic.mechanic_profile.rating >= 4)
          .sort((a, b) => {
            const ratingA = a.mechanic_profile.rating || 0;
            const ratingB = b.mechanic_profile.rating || 0;
            return ratingB - ratingA;
          });
      }

      console.log("Final filtered mechanics:", filteredMechanics.length);
      setMechanics(filteredMechanics);
      // Reset the visible mechanic count when filters change
      setVisibleMechanicsCount(6);
    } catch (error: any) {
      console.error("Error fetching mechanics:", error);
      toast.error("ხელოსნების ჩატვირთვისას შეცდომა დაფიქსირდა");
    }
  };

  const handleSearch = () => {
    setLoading(true);
    // Update URL params
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory) params.set("category", selectedCategory.toString());
    if (selectedCity) params.set("city", selectedCity);
    setSearchParams(params);
  };

  const handleCategoryChange = (categoryId: number) => {
    const newCategoryId = categoryId === selectedCategory ? null : categoryId;
    setSelectedCategory(newCategoryId);
    setLoading(true);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    if (newCategoryId) {
      params.set("category", newCategoryId.toString());
    } else {
      params.delete("category");
    }
    setSearchParams(params);
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setLoading(true);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    if (city) {
      params.set("city", city);
    } else {
      params.delete("city");
    }
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedCity(null);
    setActiveTab("all");
    setSearchParams({});
    setLoading(true);
    fetchMechanics()
      .finally(() => setLoading(false));
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setLoading(true);
    fetchMechanics(searchQuery, selectedCategory, selectedCity)
      .finally(() => setLoading(false));
  };

  const loadMoreMechanics = () => {
    setVisibleMechanicsCount(prevCount => prevCount + 6);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">ხელოსნების ძიება</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="col-span-3">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="ჩაწერეთ სპეციალობა, სერვისი ან ხელოსნის სახელი..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>
                
                <div>
                  <Select value={selectedCity || ""} onValueChange={handleCityChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="აირჩიეთ ქალაქი" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {cities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleSearch} className="flex-1">
                    <SearchIcon className="h-4 w-4 mr-2" />
                    ძიება
                  </Button>
                  <Button variant="outline" onClick={handleResetFilters}>
                    გასუფთავება
                  </Button>
                </div>
              </div>

              {serviceCategories.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">სერვისის კატეგორიები:</p>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                    {serviceCategories.map(category => (
                      <Button 
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleCategoryChange(category.id)}
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="w-full">
                  <TabsTrigger value="all" className="flex-1">ყველა</TabsTrigger>
                  <TabsTrigger value="top_rated" className="flex-1">საუკეთესო შეფასებით</TabsTrigger>
                  <TabsTrigger value="mobile" className="flex-1">მობილური სერვისი</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  {/* Content will be displayed below */}
                </TabsContent>
                <TabsContent value="top_rated">
                  {/* Content will be displayed below */}
                </TabsContent>
                <TabsContent value="mobile">
                  {/* Content will be displayed below */}
                </TabsContent>
              </Tabs>
            </div>
            
            {loading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-6">
                    <div className="flex gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-6 w-1/3 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-1" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : mechanics.length > 0 ? (
              <div>
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">ნაპოვნია {mechanics.length} ხელოსანი</p>
                  {mechanics.slice(0, visibleMechanicsCount).map(mechanic => (
                    <MechanicCard
                      key={mechanic.id}
                      id={mechanic.id}
                      name={`${mechanic.profile.first_name} ${mechanic.profile.last_name}`}
                      specialization={mechanic.mechanic_profile.specialization || "ავტოხელოსანი"}
                      location={`${mechanic.profile.city}${mechanic.profile.district ? `, ${mechanic.profile.district}` : ''}`}
                      rating={mechanic.mechanic_profile.rating || 0}
                      reviewCount={mechanic.mechanic_profile.review_count ? Number(mechanic.mechanic_profile.review_count) : 0}
                      verified={true}
                      isMobile={mechanic.mechanic_profile.is_mobile}
                      experience={mechanic.mechanic_profile.experience_years || 0}
                      description={mechanic.mechanic_profile.description || ""}
                      services={mechanic.services.map(s => s.name).slice(0, 3)}
                    />
                  ))}
                </div>

                {mechanics.length > visibleMechanicsCount && (
                  <div className="mt-8 text-center">
                    <Button variant="outline" onClick={loadMoreMechanics}>
                      მეტის ჩვენება ({mechanics.length - visibleMechanicsCount})
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">მოძებნეთ საუკეთესო ავტოხელოსანი თქვენი მანქანისთვის</p>
                {(searchQuery || selectedCategory || selectedCity) ? (
                  <p className="mt-4">ძიების შედეგად ხელოსნები ვერ მოიძებნა. სცადეთ სხვა პარამეტრებით ძიება.</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SearchPage;
