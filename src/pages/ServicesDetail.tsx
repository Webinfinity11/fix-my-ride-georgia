
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ServiceFilters from "@/components/services/ServiceFilters";
import ServiceCard from "@/components/services/ServiceCard";

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
  category: {
    id: number;
    name: string;
  } | null;
  mechanic: {
    id: string;
    first_name: string;
    last_name: string;
    rating: number | null;
  };
};

type ServiceCategory = {
  id: number;
  name: string;
};

const ServicesDetail = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleServicesCount, setVisibleServicesCount] = useState(12);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [onSiteOnly, setOnSiteOnly] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);

  // Initialize filters from URL parameters
  useEffect(() => {
    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const city = searchParams.get("city");
    const district = searchParams.get("district");
    const brands = searchParams.get("brands");
    const onSite = searchParams.get("onSite");
    const rating = searchParams.get("minRating");

    if (q) setSearchTerm(q);
    if (category) setSelectedCategory(parseInt(category));
    if (city) setSelectedCity(city);
    if (district) setSelectedDistrict(district);
    if (brands) setSelectedBrands(brands.split(","));
    if (onSite === "true") setOnSiteOnly(true);
    if (rating) setMinRating(parseInt(rating));
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
  }, [searchTerm, selectedCategory, selectedCity, selectedDistrict, selectedBrands, onSiteOnly, minRating]);

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
          service_categories(id, name),
          profiles!mechanic_services_mechanic_id_fkey(
            id,
            first_name,
            last_name,
            mechanic_profiles(rating)
          )
        `)
        .eq("is_active", true);

      // Apply filters
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (selectedCategory !== "all") {
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
          category: service.service_categories,
          mechanic: {
            id: profile?.id || "",
            first_name: profile?.first_name || "",
            last_name: profile?.last_name || "",
            rating: profile?.mechanic_profiles?.rating || null,
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
    
    if (searchTerm) params.set("q", searchTerm);
    if (selectedCategory !== "all") params.set("category", selectedCategory.toString());
    if (selectedCity) params.set("city", selectedCity);
    if (selectedDistrict) params.set("district", selectedDistrict);
    if (selectedBrands.length > 0) params.set("brands", selectedBrands.join(","));
    if (onSiteOnly) params.set("onSite", "true");
    if (minRating) params.set("minRating", minRating.toString());
    
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">ყველა სერვისი</h1>
            
            <ServiceFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
              selectedCity={selectedCity}
              setSelectedCity={setSelectedCity}
              cities={cities}
              selectedDistrict={selectedDistrict}
              setSelectedDistrict={setSelectedDistrict}
              districts={districts}
              selectedBrands={selectedBrands}
              setSelectedBrands={setSelectedBrands}
              onSiteOnly={onSiteOnly}
              setOnSiteOnly={setOnSiteOnly}
              minRating={minRating}
              setMinRating={setMinRating}
              onSearch={handleSearch}
              onResetFilters={handleResetFilters}
            />
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
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
                    <button
                      onClick={loadMoreServices}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      მეტის ჩვენება ({services.length - visibleServicesCount})
                    </button>
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

export default ServicesDetail;
