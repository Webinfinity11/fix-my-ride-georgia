import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceCard from "@/components/services/ServiceCard";
import ServiceCardSkeleton from "@/components/services/ServiceCardSkeleton";
import ModernServiceFilters from "@/components/services/ModernServiceFilters";
import { useServices } from "@/hooks/useServices";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search as SearchIcon, 
  Filter, 
  TrendingUp, 
  Clock, 
  MapPin,
  Star,
  User,
  Wrench,
  Zap,
  Target
} from "lucide-react";
import { toast } from "sonner";
import { createMechanicSlug } from "@/utils/slugUtils";
import { useSearchTracking } from "@/hooks/useSearchTracking";

type MechanicType = {
  id: string;
  first_name: string;
  last_name: string;
  city: string;
  district: string;
  specialization: string | null;
  rating: number | null;
  review_count: number | null;
  experience_years: number | null;
  is_mobile: boolean;
  display_id?: number;
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { trackSearch } = useSearchTracking();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeTab, setActiveTab] = useState<"services" | "mechanics">("services");
  const [mechanics, setMechanics] = useState<MechanicType[]>([]);
  const [mechanicsLoading, setMechanicsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches] = useState([
    "ძრავის შეკეთება", "სამუხრუჭე სისტემა", "ელექტროობა", "კონდიცონერი",
    "საჭის სისტემა", "დიაგნოსტიკა", "ზეთის ცვლა", "წინა ფარები"
  ]);

  const {
    services,
    categories,
    cities,
    districts,
    loading: servicesLoading,
    fetchInitialData,
    fetchDistricts,
    fetchServices,
  } = useServices();

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [carBrands, setCarBrands] = useState<string[]>([]);
  const [onSiteOnly, setOnSiteOnly] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);

  useEffect(() => {
    const initData = async () => {
      await fetchInitialData();
      // Fetch car brands
      const { data } = await supabase
        .from("car_brands")
        .select("name")
        .order("name", { ascending: true });
      if (data) {
        setCarBrands(data.map((b) => b.name));
      }
    };
    initData();
    loadRecentSearches();
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && q !== searchQuery) {
      setSearchQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedCity === "თბილისი") {
      fetchDistricts(selectedCity);
    }
  }, [selectedCity]);

  const loadRecentSearches = () => {
    const recent = localStorage.getItem("recent_searches");
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  };

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    
    const recent = [...recentSearches.filter(s => s !== query), query].slice(-5);
    setRecentSearches(recent);
    localStorage.setItem("recent_searches", JSON.stringify(recent));
  };

  const performSearch = useCallback(async (query?: string) => {
    const searchTerm = query || searchQuery;
    
    if (searchTerm.trim()) {
      saveRecentSearch(searchTerm.trim());
      // Track search for sitemap generation
      trackSearch(searchTerm.trim());
    }

    if (activeTab === "services") {
      const filters = {
        searchTerm,
        selectedCategory,
        selectedCity,
        selectedDistrict,
        selectedBrands,
        onSiteOnly,
        minRating,
      };
      await fetchServices(filters);
    } else {
      await searchMechanics(searchTerm);
    }

    // Update URL
    const params = new URLSearchParams();
    if (searchTerm) params.set("q", searchTerm);
    if (activeTab !== "services") params.set("tab", activeTab);
    setSearchParams(params);
  }, [searchQuery, activeTab, selectedCategory, selectedCity, selectedDistrict, selectedBrands, onSiteOnly, minRating]);

  const searchMechanics = async (query: string) => {
    setMechanicsLoading(true);
    try {
      let mechanicsQuery = supabase
        .from("profiles")
        .select(`
          id,
          first_name,
          last_name,
          city,
          district,
          mechanic_profiles!inner(
            display_id,
            specialization,
            rating,
            review_count,
            experience_years,
            is_mobile
          )
        `);

      if (query.trim()) {
        mechanicsQuery = mechanicsQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,mechanic_profiles.specialization.ilike.%${query}%`);
      }

      const { data, error } = await mechanicsQuery.limit(20);

      if (error) throw error;

      const transformedMechanics: MechanicType[] = data?.map(mechanic => {
        const profile = Array.isArray(mechanic.mechanic_profiles) 
          ? mechanic.mechanic_profiles[0] 
          : mechanic.mechanic_profiles;

        return {
          id: mechanic.id,
          first_name: mechanic.first_name,
          last_name: mechanic.last_name,
          city: mechanic.city,
          district: mechanic.district,
          specialization: profile?.specialization || null,
          rating: profile?.rating || null,
          review_count: profile?.review_count || null,
          experience_years: profile?.experience_years || null,
          is_mobile: profile?.is_mobile || false,
          display_id: profile?.display_id || undefined,
        };
      }) || [];

      setMechanics(transformedMechanics);
    } catch (error: any) {
      console.error("Error searching mechanics:", error);
      toast.error("ხელოსნების ძიებისას შეცდომა დაფიქსირდა");
    } finally {
      setMechanicsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setSelectedCity(null);
    setSelectedDistrict(null);
    setSelectedBrands([]);
    setSelectedBrand(null);
    setOnSiteOnly(false);
    setMinRating(null);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recent_searches");
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />
      
      <main className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Hero Search Section */}
            <div className="text-center mb-12">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  იპოვეთ საუკეთესო 
                  <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent"> სერვისი</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  ათასობით ხელოსანი და სერვისი ერთ ადგილას
                </p>

                {/* Main Search Bar */}
                <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-8">
                  <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="მოძებნეთ სერვისი ან ხელოსანი..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-24 py-6 text-lg border-2 border-gray-200 focus:border-primary rounded-2xl shadow-lg bg-white/90 backdrop-blur-sm"
                    />
                    <Button 
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 rounded-xl"
                    >
                      ძიება
                    </Button>
                  </div>
                </form>

                {/* Quick Search Suggestions */}
                {!searchQuery && (
                  <div className="max-w-4xl mx-auto">
                    {/* Popular Searches */}
                    <div className="mb-6">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <span className="font-medium text-gray-700">პოპულარული ძიებები</span>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {popularSearches.map((search) => (
                          <Button
                            key={search}
                            variant="outline"
                            onClick={() => handleQuickSearch(search)}
                            className="rounded-full hover:bg-primary hover:text-white transition-colors"
                          >
                            {search}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div>
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <Clock className="h-5 w-5 text-gray-500" />
                          <span className="font-medium text-gray-700">ბოლო ძიებები</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearRecentSearches}
                            className="text-xs text-gray-500 hover:text-red-500"
                          >
                            გასუფთავება
                          </Button>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                          {recentSearches.slice().reverse().map((search, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              onClick={() => handleQuickSearch(search)}
                              className="rounded-full bg-gray-100 hover:bg-primary hover:text-white transition-colors"
                            >
                              {search}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Results Section */}
            {(searchQuery || searchParams.get("q")) && (
              <div>
                {/* Search Results Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      ძიების შედეგები: "{searchQuery || searchParams.get("q")}"
                    </h2>
                    <Badge variant="secondary" className="px-3 py-1">
                      {activeTab === "services" ? services.length : mechanics.length} ნაპოვნი
                    </Badge>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "services" | "mechanics")} className="mb-8">
                  <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/80 backdrop-blur-sm">
                    <TabsTrigger value="services" className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      სერვისები
                    </TabsTrigger>
                    <TabsTrigger value="mechanics" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      ხელოსნები
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="services" className="space-y-6">
                    {/* Filters */}
                    <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <ModernServiceFilters
                          searchTerm={searchQuery}
                          setSearchTerm={setSearchQuery}
                          selectedCategory={selectedCategory}
                          setSelectedCategory={setSelectedCategory}
                          categories={categories}
                          selectedCity={selectedCity}
                          setSelectedCity={setSelectedCity}
                          cities={cities}
                          selectedDistrict={selectedDistrict}
                          setSelectedDistrict={setSelectedDistrict}
                          districts={districts}
                          selectedBrand={selectedBrand}
                          setSelectedBrand={setSelectedBrand}
                          carBrands={carBrands}
                          onSiteOnly={onSiteOnly}
                          setOnSiteOnly={setOnSiteOnly}
                          minRating={minRating}
                          setMinRating={setMinRating}
                          onSearch={performSearch}
                          onResetFilters={handleResetFilters}
                        />
                      </CardContent>
                    </Card>

                    {/* Services Results */}
                    {servicesLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                          <ServiceCardSkeleton key={i} />
                        ))}
                      </div>
                    ) : services.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {services.map(service => (
                          <ServiceCard key={service.id} service={service} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <Target className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">სერვისები ვერ მოიძებნა</h3>
                        <p className="text-gray-600 mb-6">შეცვალეთ საძიებო კრიტერიუმები ან სცადეთ სხვა საძიებო სიტყვები</p>
                        <Button onClick={handleResetFilters} variant="outline">
                          ფილტრების გასუფთავება
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="mechanics" className="space-y-6">
                    {/* Mechanics Results */}
                    {mechanicsLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                          <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                                <div className="space-y-2">
                                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="h-3 bg-gray-200 rounded"></div>
                                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : mechanics.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mechanics.map(mechanic => (
                          <Card key={mechanic.id} className="hover:shadow-xl transition-all duration-200 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                            <CardContent className="p-6">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                  {mechanic.first_name[0]}{mechanic.last_name[0]}
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg text-gray-900">
                                    {mechanic.first_name} {mechanic.last_name}
                                  </h3>
                                  <p className="text-gray-600">{mechanic.specialization}</p>
                                </div>
                              </div>

                              <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <MapPin className="h-4 w-4 text-primary" />
                                  <span>{mechanic.city}{mechanic.district ? `, ${mechanic.district}` : ''}</span>
                                </div>

                                {mechanic.rating && (
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center">
                                      {renderStars(Math.round(mechanic.rating))}
                                    </div>
                                    <span className="font-semibold">{mechanic.rating}</span>
                                    <span className="text-gray-500 text-sm">({mechanic.review_count})</span>
                                  </div>
                                )}

                                {mechanic.experience_years && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Zap className="h-4 w-4 text-primary" />
                                    <span>{mechanic.experience_years} წლის გამოცდილება</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <Button 
                  onClick={() => navigate(`/mechanic/${createMechanicSlug(mechanic.display_id || 0, mechanic.first_name, mechanic.last_name)}`)}
                  className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                                >
                                  პროფილი
                                </Button>
                                <Button 
                                  variant="outline" 
                                  onClick={() => navigate(`/book?mechanic=${mechanic.id}`)}
                                  className="flex-1 hover:bg-primary hover:text-white"
                                >
                                  დაჯავშნა
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">ხელოსნები ვერ მოიძებნა</h3>
                        <p className="text-gray-600 mb-6">სცადეთ სხვა საძიებო სიტყვები ან შეცვალეთ კრიტერიუმები</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Search;