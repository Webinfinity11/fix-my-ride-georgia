
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  CreditCard, 
  Banknote, 
  Car,
  Filter,
  SlidersHorizontal,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  photos: string[] | null;
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
    is_mobile: boolean;
  };
};

type ServiceCategoryType = {
  id: number;
  name: string;
};

const ServiceSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [categories, setCategories] = useState<ServiceCategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'all');
  const [priceRange, setPriceRange] = useState(searchParams.get('price') || 'all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedCity !== 'all') params.set('city', selectedCity);
    if (priceRange !== 'all') params.set('price', priceRange);
    setSearchParams(params);
  }, [searchTerm, selectedCategory, selectedCity, priceRange, setSearchParams]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
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
          photos,
          service_categories(id, name),
          profiles!mechanic_services_mechanic_id_fkey(
            id,
            first_name,
            last_name,
            city,
            district,
            mechanic_profiles(
              rating,
              review_count,
              is_mobile
            )
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const transformedData = data?.map(service => {
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
          photos: service.photos,
          category: service.service_categories,
          mechanic: {
            id: profile?.id || "",
            first_name: profile?.first_name || "",
            last_name: profile?.last_name || "",
            city: profile?.city || "",
            district: profile?.district || "",
            rating: profile?.mechanic_profiles?.rating || null,
            review_count: profile?.mechanic_profiles?.review_count || null,
            is_mobile: profile?.mechanic_profiles?.is_mobile || false
          }
        };
      }) || [];

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
        .select("id, name")
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
    }
  };

  const formatPrice = (priceFrom: number | null, priceTo: number | null) => {
    if (!priceFrom && !priceTo) return "ფასი შეთანხმებით";
    if (priceFrom && priceTo) return `${priceFrom} - ${priceTo} ₾`;
    if (priceFrom) return `${priceFrom} ₾-დან`;
    return "ფასი შეთანხმებით";
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

  // Filter services based on search criteria
  const filteredServices = services.filter(service => {
    const matchesSearch = !searchTerm || 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (service.category?.name && service.category.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || 
      service.category?.id.toString() === selectedCategory;

    const matchesCity = selectedCity === 'all' || 
      service.city?.toLowerCase() === selectedCity.toLowerCase();

    const matchesPrice = priceRange === 'all' || (() => {
      const price = service.price_from || 0;
      switch (priceRange) {
        case 'low': return price < 50;
        case 'medium': return price >= 50 && price < 150;
        case 'high': return price >= 150;
        default: return true;
      }
    })();

    return matchesSearch && matchesCategory && matchesCity && matchesPrice;
  });

  // Get unique cities from services
  const cities = Array.from(new Set(services.map(service => service.city).filter(Boolean)));

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-muted py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded mb-4 w-2/3"></div>
                    <div className="h-8 bg-gray-300 rounded"></div>
                  </CardContent>
                </Card>
              ))}
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
          {/* Search and Filter Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-6">სერვისების ძიება</h1>
            
            {/* Search Bar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ძიება სერვისის მიხედვით..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="h-12 px-6"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                ფილტრები
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow-sm border">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="კატეგორია" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ყველა კატეგორია</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="ქალაქი" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ყველა ქალაქი</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="ფასის ზღვარი" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ყველა ფასი</SelectItem>
                    <SelectItem value="low">50₾ მდე</SelectItem>
                    <SelectItem value="medium">50₾ - 150₾</SelectItem>
                    <SelectItem value="high">150₾ და მეტი</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Results Count */}
            <div className="flex justify-between items-center mt-6">
              <p className="text-muted-foreground">
                მოიძებნა {filteredServices.length} სერვისი
              </p>
              {(searchTerm || selectedCategory !== 'all' || selectedCity !== 'all' || priceRange !== 'all') && (
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedCity('all');
                    setPriceRange('all');
                  }}
                  className="text-sm"
                >
                  ფილტრების გასუფთავება
                </Button>
              )}
            </div>
          </div>

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">სერვისები ვერ მოიძებნა</h3>
              <p className="text-muted-foreground mb-4">
                შეცვალეთ ძიების პირობები და სცადეთ ხელახლა
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedCity('all');
                  setPriceRange('all');
                }}
              >
                ყველა სერვისის ნახვა
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-0">
                    {/* Service Image */}
                    <div className="h-48 bg-muted rounded-t-lg overflow-hidden">
                      {service.photos && service.photos.length > 0 ? (
                        <img 
                          src={service.photos[0]} 
                          alt={service.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <Car className="h-16 w-16 text-primary/40" />
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      {/* Category Badge */}
                      {service.category && (
                        <Badge variant="secondary" className="mb-3">
                          {service.category.name}
                        </Badge>
                      )}

                      {/* Service Name */}
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                        {service.name}
                      </h3>

                      {/* Description */}
                      {service.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {service.description}
                        </p>
                      )}

                      {/* Mechanic Info */}
                      <div className="flex items-center gap-2 mb-3 text-sm">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <span className="font-medium">
                          {service.mechanic.first_name} {service.mechanic.last_name}
                        </span>
                        {service.mechanic.rating && (
                          <div className="flex items-center gap-1 ml-auto">
                            {renderStars(Math.round(service.mechanic.rating))}
                            <span className="text-xs">({service.mechanic.review_count})</span>
                          </div>
                        )}
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-3 w-3" />
                        <span>{service.city}{service.district ? `, ${service.district}` : ''}</span>
                        {service.mechanic.is_mobile && (
                          <Badge variant="outline" className="ml-2 text-xs">მობილური</Badge>
                        )}
                      </div>

                      {/* Service Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center text-sm">
                          <span>ფასი:</span>
                          <span className="font-semibold text-primary">
                            {formatPrice(service.price_from, service.price_to)}
                          </span>
                        </div>
                        
                        {service.estimated_hours && (
                          <div className="flex justify-between items-center text-sm">
                            <span>დრო:</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {service.estimated_hours}ს
                            </span>
                          </div>
                        )}

                        {/* Payment Methods */}
                        <div className="flex items-center gap-2 text-xs">
                          {service.accepts_cash_payment && (
                            <div className="flex items-center gap-1 text-green-600">
                              <Banknote className="h-3 w-3" />
                              <span>ნაღდი</span>
                            </div>
                          )}
                          {service.accepts_card_payment && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <CreditCard className="h-3 w-3" />
                              <span>ბარათი</span>
                            </div>
                          )}
                          {service.on_site_service && (
                            <Badge variant="outline" className="text-xs">ადგილზე მისვლა</Badge>
                          )}
                        </div>
                      </div>

                      {/* Service Rating */}
                      {service.rating && (
                        <div className="flex items-center gap-2 mb-4 p-2 bg-muted rounded-lg">
                          <div className="flex items-center gap-1">
                            {renderStars(Math.round(service.rating))}
                          </div>
                          <span className="text-sm font-medium">{service.rating}</span>
                          <span className="text-xs text-muted-foreground">({service.review_count} შეფასება)</span>
                        </div>
                      )}

                      {/* Action Button */}
                      <Link to={`/service/${service.id}`}>
                        <Button className="w-full">
                          დეტალურად ნახვა
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ServiceSearch;
