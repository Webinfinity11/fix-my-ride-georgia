
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import ServiceCard from "@/components/services/ServiceCard";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type ServiceType = {
  id: number;
  name: string;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  estimated_hours: number | null;
  city: string | null;
  district: string | null;
  car_brands: string[] | null;
  on_site_service: boolean;
  accepts_card_payment: boolean;
  accepts_cash_payment: boolean;
  rating: number | null;
  review_count: number | null;
  address: string | null;
  photos: string[] | null;
  slug?: string | null;
  category: {
    id: number;
    name: string;
  } | null;
  mechanic: {
    id: string;
    first_name: string;
    last_name: string;
    rating: number | null;
    is_mobile: boolean;
    display_id?: number;
    phone_number?: string | null;
  };
};

const ServiceSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [onSiteOnly, setOnSiteOnly] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [visibleServicesCount, setVisibleServicesCount] = useState(12);

  const popularCarBrands = [
    "Mercedes-Benz", "BMW", "Toyota", "Opel", "Volkswagen", 
    "Ford", "Hyundai", "Kia", "Nissan", "Honda", 
    "Lexus", "Audi", "Mitsubishi", "Mazda", "Subaru"
  ];

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
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCity === "თბილისი") {
      fetchDistricts();
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
    }
  }, [selectedCity]);

  useEffect(() => {
    fetchServices();
  }, [searchParams, selectedCategory, selectedCity, selectedDistrict, selectedBrands, onSiteOnly, minRating]);

  const fetchInitialData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("service_categories")
        .select("id, name")
        .order("name", { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch unique cities
      const { data: servicesData, error: servicesError } = await supabase
        .from("mechanic_services")
        .select("city")
        .not("city", "is", null);

      if (servicesError) throw servicesError;
      
      const uniqueCities = Array.from(
        new Set(servicesData?.map(s => s.city).filter(Boolean) as string[])
      ).sort();
      setCities(uniqueCities);

    } catch (error: any) {
      console.error("Error fetching initial data:", error);
      toast.error("მონაცემების ჩატვირთვისას შეცდომა დაფიქსირდა");
    }
  };

  const fetchDistricts = async () => {
    try {
      const { data, error } = await supabase
        .from("mechanic_services")
        .select("district")
        .eq("city", "თბილისი")
        .not("district", "is", null);

      if (error) throw error;
      
      const uniqueDistricts = Array.from(
        new Set(data?.map(s => s.district).filter(Boolean) as string[])
      ).sort();
      setDistricts(uniqueDistricts);
    } catch (error: any) {
      console.error("Error fetching districts:", error);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("mechanic_services")
        .select(`
          id,
          name,
          description,
          price_from,
          price_to,
          estimated_hours,
          city,
          district,
          car_brands,
          on_site_service,
          accepts_card_payment,
          accepts_cash_payment,
          rating,
          review_count,
          address,
          photos,
          service_categories(id, name),
          profiles!mechanic_id(
            id,
            first_name,
            last_name,
            phone,
            mechanic_profiles(display_id, rating, is_mobile)
          )
        `)
        .eq("is_active", true);

      // Apply filters
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }

      if (selectedCity) {
        query = query.eq("city", selectedCity);
      }

      if (selectedDistrict) {
        query = query.eq("district", selectedDistrict);
      }

      if (onSiteOnly) {
        query = query.eq("on_site_service", true);
      }

      if (minRating) {
        query = query.gte("rating", minRating);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      let filteredServices = data?.map(service => {
        const profile = Array.isArray(service.profiles) ? service.profiles[0] : service.profiles;
        
        return {
          id: service.id,
          name: service.name,
          description: service.description,
          price_from: service.price_from,
          price_to: service.price_to,
          estimated_hours: service.estimated_hours,
          city: service.city,
          district: service.district,
          car_brands: service.car_brands,
          on_site_service: service.on_site_service,
          accepts_card_payment: service.accepts_card_payment,
          accepts_cash_payment: service.accepts_cash_payment,
          rating: service.rating,
          review_count: service.review_count,
          address: service.address,
          photos: service.photos || [],
          category: service.service_categories,
          mechanic: {
            id: profile?.id || "",
            first_name: profile?.first_name || "",
            last_name: profile?.last_name || "",
            rating: profile?.mechanic_profiles?.rating || null,
            is_mobile: profile?.mechanic_profiles?.is_mobile || false,
            display_id: profile?.mechanic_profiles?.display_id || undefined,
            phone_number: profile?.phone || null
          }
        };
      }) || [];

      // Filter by car brands
      if (selectedBrands.length > 0) {
        filteredServices = filteredServices.filter(service => 
          service.car_brands && 
          selectedBrands.some(brand => service.car_brands?.includes(brand))
        );
      }

      setServices(filteredServices);
      setVisibleServicesCount(12);
    } catch (error: any) {
      console.error("Error fetching services:", error);
      toast.error("სერვისების ჩატვირთვისას შეცდომა დაფიქსირდა");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory) params.set("category", selectedCategory.toString());
    if (selectedCity) params.set("city", selectedCity);
    setSearchParams(params);
  };

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedCity(null);
    setSelectedDistrict(null);
    setSelectedBrands([]);
    setOnSiteOnly(false);
    setMinRating(null);
    setSearchParams({});
  };

  const loadMoreServices = () => {
    setVisibleServicesCount(prev => prev + 12);
  };

  const formatPrice = (priceFrom: number | null, priceTo: number | null) => {
    if (!priceFrom && !priceTo) return "ფასი შეთანხმებით";
    if (priceFrom && priceTo) return `${priceFrom} - ${priceTo} GEL`;
    if (priceFrom) return `${priceFrom} GEL დან`;
    return "ფასი შეთანხმებით";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">სერვისების ძიება</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="col-span-4">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="ჩაწერეთ სერვისის სახელი ან აღწერა..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>
                
                <div>
                  <Select value={selectedCity || ""} onValueChange={setSelectedCity}>
                    <SelectTrigger>
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

                {selectedCity === "თბილისი" && (
                  <div>
                    <Select value={selectedDistrict || ""} onValueChange={setSelectedDistrict}>
                      <SelectTrigger>
                        <SelectValue placeholder="აირჩიეთ უბანი" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {districts.map(district => (
                            <SelectItem key={district} value={district}>{district}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <Select value={selectedCategory?.toString() || ""} onValueChange={(value) => setSelectedCategory(value ? parseInt(value) : null)}>
                    <SelectTrigger>
                      <SelectValue placeholder="კატეგორია" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
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

              {/* Advanced Filters */}
              <div className="mt-6 space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="onSiteService"
                      checked={onSiteOnly}
                      onCheckedChange={(checked) => setOnSiteOnly(checked === true)}
                    />
                    <label htmlFor="onSiteService" className="text-sm">ადგილზე მისვლის სერვისი</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm">მინიმალური რეიტინგი:</label>
                    <Select value={minRating?.toString() || "all"} onValueChange={(value) => setMinRating(value === "all" ? null : parseInt(value))}>
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="ყველა" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ყველა</SelectItem>
                        <SelectItem value="4">4+ ★</SelectItem>
                        <SelectItem value="3">3+ ★</SelectItem>
                        <SelectItem value="2">2+ ★</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">მანქანის მარკა:</label>
                  <div className="flex flex-wrap gap-2">
                    {popularCarBrands.slice(0, 8).map(brand => (
                      <Button
                        key={brand}
                        variant={selectedBrands.includes(brand) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleBrandToggle(brand)}
                      >
                        {brand}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : services.length > 0 ? (
              <div>
                <p className="text-sm text-muted-foreground mb-6">ნაპოვნია {services.length} სერვისი</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.slice(0, visibleServicesCount).map(service => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>

                {services.length > visibleServicesCount && (
                  <div className="mt-8 text-center">
                    <Button variant="outline" onClick={loadMoreServices}>
                      მეტის ჩვენება ({services.length - visibleServicesCount})
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">სერვისები ვერ მოიძებნა შერჩეული ფილტრებით</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ServiceSearch;
