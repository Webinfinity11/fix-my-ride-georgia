import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, MapPin, Clock, CreditCard, Banknote, Car, Search, User, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ServiceFilters from "@/components/services/ServiceFilters";

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
  working_days: string[] | null;
  working_hours_start: string | null;
  working_hours_end: string | null;
  photos: string[] | null;
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
    city: string;
    district: string;
    rating: number | null;
    review_count: number | null;
  };
};

type ServiceCategory = {
  id: number;
  name: string;
  description: string | null;
};

const weekDaysMap: Record<string, string> = {
  "monday": "ორშაბათი",
  "tuesday": "სამშაბათი", 
  "wednesday": "ოთხშაბათი",
  "thursday": "ხუთშაბათი",
  "friday": "პარასკევი",
  "saturday": "შაბათი",
  "sunday": "კვირა"
};

const ServicesDetail = () => {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [onSiteOnly, setOnSiteOnly] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);

  useEffect(() => {
    fetchServices();
    fetchCategories();
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

  const fetchInitialData = async () => {
    try {
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
      console.error("Error fetching cities:", error);
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
    try {
      console.log("Fetching services...");
      
      // First get all active services
      const { data: servicesData, error: servicesError } = await supabase
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
          working_days,
          working_hours_start,
          working_hours_end,
          photos,
          rating,
          review_count,
          category_id,
          mechanic_id
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (servicesError) throw servicesError;

      console.log("Services data:", servicesData);

      if (!servicesData || servicesData.length === 0) {
        setServices([]);
        return;
      }

      // Get unique category IDs
      const categoryIds = [...new Set(servicesData.map(s => s.category_id).filter(Boolean))];
      
      // Fetch categories
      let categoriesData = [];
      if (categoryIds.length > 0) {
        const { data: catData, error: catError } = await supabase
          .from("service_categories")
          .select("id, name")
          .in("id", categoryIds);
        
        if (catError) throw catError;
        categoriesData = catData || [];
      }

      // Get unique mechanic IDs
      const mechanicIds = [...new Set(servicesData.map(s => s.mechanic_id))];
      
      // Fetch mechanic profiles
      const { data: mechanicsData, error: mechanicsError } = await supabase
        .from("profiles")
        .select(`
          id,
          first_name,
          last_name,
          city,
          district,
          mechanic_profiles(rating, review_count)
        `)
        .in("id", mechanicIds);

      if (mechanicsError) throw mechanicsError;

      console.log("Mechanics data:", mechanicsData);

      // Transform the data
      const transformedData = servicesData.map(service => {
        const mechanic = mechanicsData?.find(m => m.id === service.mechanic_id);
        const category = categoriesData.find(c => c.id === service.category_id);
        
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
          working_days: service.working_days,
          working_hours_start: service.working_hours_start,
          working_hours_end: service.working_hours_end,
          photos: service.photos,
          rating: service.rating,
          review_count: service.review_count,
          category: category || null,
          mechanic: {
            id: mechanic?.id || "",
            first_name: mechanic?.first_name || "",
            last_name: mechanic?.last_name || "",
            city: mechanic?.city || "",
            district: mechanic?.district || "",
            rating: mechanic?.mechanic_profiles?.rating || null,
            review_count: mechanic?.mechanic_profiles?.review_count || null
          }
        };
      });

      console.log("Transformed services:", transformedData);
      setServices(transformedData);
    } catch (error: any) {
      console.error("Error fetching services:", error);
      toast.error("სერვისების ჩატვირთვისას შეცდომა დაფიქსირდა");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("id, name, description")
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
    }
  };

  const formatPrice = (priceFrom: number | null, priceTo: number | null) => {
    if (!priceFrom && !priceTo) return "ფასი შეთანხმებით";
    if (priceFrom && priceTo) return `${priceFrom} - ${priceTo} GEL`;
    if (priceFrom) return `${priceFrom} GEL დან`;
    return "ფასი შეთანხმებით";
  };

  const formatWorkingDays = (days: string[] | null) => {
    if (!days || days.length === 0) return "არ არის მითითებული";
    if (days.length === 7) return "ყოველდღე";
    return days.slice(0, 3).map(day => weekDaysMap[day] || day).join(", ") + (days.length > 3 ? "..." : "");
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const handleSearch = () => {
    // Apply all filters
    fetchFilteredServices();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedCity(null);
    setSelectedDistrict(null);
    setSelectedBrands([]);
    setOnSiteOnly(false);
    setMinRating(null);
    fetchServices();
  };

  const fetchFilteredServices = async () => {
    setLoading(true);
    try {
      console.log("Fetching filtered services...");
      
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
          working_days,
          working_hours_start,
          working_hours_end,
          photos,
          rating,
          review_count,
          category_id,
          mechanic_id
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

      const { data: servicesData, error: servicesError } = await query.order("created_at", { ascending: false });

      if (servicesError) throw servicesError;

      if (!servicesData || servicesData.length === 0) {
        setServices([]);
        return;
      }

      // Get unique category IDs
      const categoryIds = [...new Set(servicesData.map(s => s.category_id).filter(Boolean))];
      
      // Fetch categories
      let categoriesData = [];
      if (categoryIds.length > 0) {
        const { data: catData, error: catError } = await supabase
          .from("service_categories")
          .select("id, name")
          .in("id", categoryIds);
        
        if (catError) throw catError;
        categoriesData = catData || [];
      }

      // Get unique mechanic IDs
      const mechanicIds = [...new Set(servicesData.map(s => s.mechanic_id))];
      
      // Fetch mechanic profiles
      const { data: mechanicsData, error: mechanicsError } = await supabase
        .from("profiles")
        .select(`
          id,
          first_name,
          last_name,
          city,
          district,
          mechanic_profiles(rating, review_count)
        `)
        .in("id", mechanicIds);

      if (mechanicsError) throw mechanicsError;

      // Transform the data
      let transformedData = servicesData.map(service => {
        const mechanic = mechanicsData?.find(m => m.id === service.mechanic_id);
        const category = categoriesData.find(c => c.id === service.category_id);
        
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
          working_days: service.working_days,
          working_hours_start: service.working_hours_start,
          working_hours_end: service.working_hours_end,
          photos: service.photos,
          rating: service.rating,
          review_count: service.review_count,
          category: category || null,
          mechanic: {
            id: mechanic?.id || "",
            first_name: mechanic?.first_name || "",
            last_name: mechanic?.last_name || "",
            city: mechanic?.city || "",
            district: mechanic?.district || "",
            rating: mechanic?.mechanic_profiles?.rating || null,
            review_count: mechanic?.mechanic_profiles?.review_count || null
          }
        };
      });

      // Filter by car brands
      if (selectedBrands.length > 0) {
        transformedData = transformedData.filter(service => 
          service.car_brands && 
          selectedBrands.some(brand => service.car_brands?.includes(brand))
        );
      }

      setServices(transformedData);
    } catch (error: any) {
      console.error("Error fetching filtered services:", error);
      toast.error("სერვისების ჩატვირთვისას შეცდომა დაფიქსირდა");
    } finally {
      setLoading(false);
    }
  };

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (service.category?.name && service.category.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      `${service.mechanic.first_name} ${service.mechanic.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || service.category?.id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-muted py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <Skeleton className="h-8 w-1/2 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">ყველა სერვისი</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                აღმოაჩინეთ ჩვენი მრავალფეროვანი ავტო სერვისები. ყველა სერვისი მოწოდებულია გამოცდილი ხელოსნების მიერ.
              </p>
            </div>

            {/* Filters */}
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

            {/* Services Grid */}
            {filteredServices.length === 0 ? (
              <div className="text-center p-8 bg-background rounded-lg border border-primary/10">
                <p className="text-muted-foreground">სერვისები ვერ მოიძებნა</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
                  <Card key={service.id} className="hover:shadow-lg transition-all duration-300 border-primary/10 group">
                    <CardContent className="p-0">
                      {/* Service Image */}
                      <div className="relative h-48 bg-gradient-to-br from-primary/5 to-primary/10 rounded-t-lg overflow-hidden">
                        {service.photos && service.photos.length > 0 ? (
                          <img
                            src={service.photos[0]}
                            alt={service.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="h-16 w-16 text-primary/30" />
                          </div>
                        )}
                        
                        {/* Category Badge */}
                        {service.category && (
                          <Badge 
                            variant="secondary" 
                            className="absolute top-3 left-3 bg-white/90 text-primary"
                          >
                            {service.category.name}
                          </Badge>
                        )}

                        {/* Rating */}
                        {service.rating && (
                          <div className="absolute top-3 right-3 bg-white/90 rounded-full px-2 py-1 flex items-center gap-1">
                            <div className="flex items-center">
                              {renderStars(Math.round(service.rating))}
                            </div>
                            <span className="text-xs font-medium">{service.rating}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        {/* Service Name */}
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                          {service.name}
                        </h3>

                        {/* Description */}
                        {service.description && (
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {service.description}
                          </p>
                        )}

                        {/* Mechanic Info */}
                        <div className="flex items-center gap-2 mb-3">
                          <User className="h-4 w-4 text-primary/70" />
                          <Link 
                            to={`/mechanic/${service.mechanic.id}`}
                            className="text-sm font-medium hover:text-primary transition-colors"
                          >
                            {service.mechanic.first_name} {service.mechanic.last_name}
                          </Link>
                          {service.mechanic.rating && (
                            <div className="flex items-center gap-1 ml-auto">
                              <div className="flex items-center">
                                {renderStars(Math.round(service.mechanic.rating))}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                ({service.mechanic.review_count})
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                          <MapPin className="h-3 w-3" />
                          <span>{service.city}{service.district ? `, ${service.district}` : ''}</span>
                        </div>

                        {/* Price */}
                        <div className="text-lg font-bold text-primary mb-3">
                          {formatPrice(service.price_from, service.price_to)}
                        </div>

                        {/* Features */}
                        <div className="space-y-2 mb-4">
                          {service.estimated_hours && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>სავარაუდო დრო: {service.estimated_hours} საათი</span>
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-sm">
                            {service.accepts_cash_payment && (
                              <div className="flex items-center gap-1">
                                <Banknote className="h-3 w-3 text-green-600" />
                                <span>ნაღდი</span>
                              </div>
                            )}
                            {service.accepts_card_payment && (
                              <div className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3 text-blue-600" />
                                <span>ბარათი</span>
                              </div>
                            )}
                          </div>

                          {service.working_days && (
                            <div className="text-xs text-muted-foreground">
                              {formatWorkingDays(service.working_days)}
                            </div>
                          )}

                          {service.on_site_service && (
                            <Badge variant="outline" className="text-xs">
                              ადგილზე მისვლა
                            </Badge>
                          )}
                        </div>

                        {/* Car Brands */}
                        {service.car_brands && service.car_brands.length > 0 && (
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-1">
                              {service.car_brands.slice(0, 3).map(brand => (
                                <Badge key={brand} variant="outline" className="text-xs bg-muted/50">
                                  {brand}
                                </Badge>
                              ))}
                              {service.car_brands.length > 3 && (
                                <Badge variant="outline" className="text-xs bg-muted/50">
                                  +{service.car_brands.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Link to={`/service/${service.id}`} className="flex-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full border-primary/20 hover:bg-primary/5"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              დეტალები
                            </Button>
                          </Link>
                          <Link to={`/book?service=${service.id}`} className="flex-1">
                            <Button size="sm" className="w-full bg-primary hover:bg-primary-light">
                              დაჯავშნა
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
