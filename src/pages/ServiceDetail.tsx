import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { createSlug, extractServiceId } from "@/utils/slugUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { 
  Clock, 
  MapPin, 
  Star, 
  CreditCard, 
  Banknote, 
  Car, 
  Calendar,
  ArrowLeft,
  Phone,
  MessageCircle,
  Eye,
  EyeOff,
  Image,
  Video
} from "lucide-react";
import { toast } from "sonner";
import LocationMapPicker from "@/components/forms/LocationMapPicker";
import ServiceReviews from "@/components/reviews/ServiceReviews";
import ServiceGallery from "@/components/services/ServiceGallery";
import ServiceVideoGallery from "@/components/services/ServiceVideoGallery";
import Layout from "@/components/layout/Layout";
import { SendMessageButton } from "@/components/mechanic/SendMessageButton";
import { useSEOData } from "@/hooks/useSEOData";
import SEOHead from "@/components/seo/SEOHead";

interface ServiceType {
  id: number;
  name: string;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  estimated_hours: number | null;
  city: string | null;
  district: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  car_brands: string[] | null;
  on_site_service: boolean;
  accepts_card_payment: boolean;
  accepts_cash_payment: boolean;
  rating: number | null;
  review_count: number | null;
  photos: string[] | null;
  videos: string[] | null;
  category: {
    id: number;
    name: string;
  } | null;
  mechanic: {
    id: string;
    first_name: string;
    last_name: string;
    rating: number | null;
    phone: string | null;
  };
}

const ServiceDetail = () => {
  console.log("🔧 ServiceDetail component mounted");
  
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<ServiceType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullPhone, setShowFullPhone] = useState(false);
  
  // Fetch SEO data for this service
  const { seoData } = useSEOData('service', service?.id.toString() || '');

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // UUID validation function
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  useEffect(() => {
    if (id) {
      fetchServiceBySlugOrId(id);
    }
  }, [id]);

  const fetchServiceBySlugOrId = async (slugOrId: string) => {
    console.log("📋 Fetching service with slug or ID:", slugOrId);
    setLoading(true);
    
    try {
      let serviceData;
      let serviceError;

      // First, try to find service by ID if it's a number
      if (/^\d+$/.test(slugOrId)) {
        const result = await supabase
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
            address,
            latitude,
            longitude,
            car_brands,
            on_site_service,
            accepts_card_payment,
            accepts_cash_payment,
            rating,
            review_count,
            photos,
            videos,
            category_id,
            mechanic_id,
            service_categories(id, name),
            mechanic_profiles(
              id,
              rating,
              profiles(
                id,
                first_name,
                last_name,
                phone
              )
            )
          `)
          .eq("id", parseInt(slugOrId))
          .eq("is_active", true)
          .single();
        
        serviceData = result.data;
        serviceError = result.error;
      } else {
        // Try to find service by slug (converted from name)
        const result = await supabase
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
            address,
            latitude,
            longitude,
            car_brands,
            on_site_service,
            accepts_card_payment,
            accepts_cash_payment,
            rating,
            review_count,
            photos,
            videos,
            category_id,
            mechanic_id,
            service_categories(id, name),
            mechanic_profiles(
              id,
              rating,
              profiles(
                id,
                first_name,
                last_name,
                phone
              )
            )
          `)
          .eq("is_active", true);
        
        if (result.data) {
          // Find service by matching slug
          const foundService = result.data.find(service => 
            createSlug(service.name) === slugOrId
          );
          
          if (foundService) {
            serviceData = foundService;
            serviceError = null;
            
            // Update URL to use slug instead of ID for better SEO
            const newSlug = createSlug(foundService.name);
            if (newSlug !== slugOrId) {
              window.history.replaceState(null, '', `/service/${newSlug}`);
            }
          } else {
            serviceError = { message: "Service not found" };
          }
        } else {
          serviceError = result.error;
        }
      }

      if (serviceError) {
        console.error("❌ Service fetch error:", serviceError);
        throw serviceError;
      }

      if (!serviceData) {
        console.log("⚠️ No service data found");
        toast.error("სერვისი ვერ მოიძებნა");
        navigate("/services");
        return;
      }

      // Process the service data (same as before)
      await processServiceData(serviceData);
      
    } catch (error: any) {
      console.error("❌ Error fetching service:", error);
      toast.error("სერვისის ჩატვირთვისას შეცდომა დაფიქსირდა");
      navigate("/services");
    } finally {
      setLoading(false);
    }
  };

  const processServiceData = async (serviceData: any) => {
    console.log("✅ Processing service data:", serviceData);
    
    // Extract nested data safely
    const category = Array.isArray(serviceData.service_categories) 
      ? serviceData.service_categories[0] 
      : serviceData.service_categories;

    const mechanicProfile = Array.isArray(serviceData.mechanic_profiles) 
      ? serviceData.mechanic_profiles[0] 
      : serviceData.mechanic_profiles;

    console.log("🧑‍🔧 Mechanic profile data:", mechanicProfile);

    // Handle case where mechanic profile might not exist
    let mechanicData = {
      id: serviceData.mechanic_id || "",
      first_name: "უცნობი",
      last_name: "ხელოსანი",
      rating: null,
      phone: null,
    };

    if (mechanicProfile?.profiles) {
      const profile = Array.isArray(mechanicProfile.profiles) 
        ? mechanicProfile.profiles[0] 
        : mechanicProfile.profiles;
      
      mechanicData = {
        id: profile?.id || serviceData.mechanic_id || "",
        first_name: profile?.first_name || "უცნობი",
        last_name: profile?.last_name || "ხელოსანი",
        rating: mechanicProfile?.rating || null,
        phone: profile?.phone || null,
      };
    }

    console.log("🔍 Mechanic ID validation:", mechanicData.id, "Is valid UUID:", isValidUUID(mechanicData.id));

    const transformedService: ServiceType = {
      id: serviceData.id,
      name: serviceData.name || "უცნობი სერვისი",
      description: serviceData.description,
      price_from: serviceData.price_from,
      price_to: serviceData.price_to,
      estimated_hours: serviceData.estimated_hours,
      city: serviceData.city,
      district: serviceData.district,
      address: serviceData.address,
      latitude: serviceData.latitude,
      longitude: serviceData.longitude,
      car_brands: serviceData.car_brands,
      on_site_service: serviceData.on_site_service || false,
      accepts_card_payment: serviceData.accepts_card_payment || false,
      accepts_cash_payment: serviceData.accepts_cash_payment || true,
      rating: serviceData.rating,
      review_count: serviceData.review_count,
      photos: serviceData.photos || [],
      videos: serviceData.videos || [],
      category: category ? {
        id: category.id,
        name: category.name
      } : null,
      mechanic: mechanicData
    };

    console.log("🗺️ Service location data:", {
      latitude: transformedService.latitude,
      longitude: transformedService.longitude,
      address: transformedService.address
    });

    console.log("🧑‍🔧 Final mechanic data:", transformedService.mechanic);

    setService(transformedService);
  };

  const handleReviewAdded = () => {
    // Refresh service data to get updated rating and review count
    if (service && id) {
      fetchServiceBySlugOrId(id);
    }
  };

  const maskPhoneNumber = (phone: string) => {
    if (!phone || phone.length < 3) return phone;
    const maskedPart = phone.slice(0, -3).replace(/\d/g, '*');
    const visiblePart = phone.slice(-3);
    return maskedPart + visiblePart;
  };

  const togglePhoneVisibility = () => {
    setShowFullPhone(!showFullPhone);
  };

  const formatPrice = (priceFrom: number | null, priceTo: number | null) => {
    // If no valid prices are provided, return default text
    if (!priceFrom && !priceTo) {
      return "ფასი შეთანხმებით";
    }
    
    // If both prices exist and are greater than 0, show range
    if (priceFrom && priceFrom > 0 && priceTo && priceTo > 0 && priceFrom !== priceTo) {
      return `₾${priceFrom} - ₾${priceTo}`;
    }
    
    // If only one price exists and is greater than 0, show that price
    if (priceFrom && priceFrom > 0) {
      return `₾${priceFrom}`;
    }
    
    if (priceTo && priceTo > 0) {
      return `₾${priceTo}`;
    }
    
    // If prices are 0 or invalid, return default text
    return "ფასი შეთანხმებით";
  };

  const handleLocationChange = () => {
    // This is just for the map display, no interaction needed
    console.log("🗺️ Map location change triggered (read-only mode)");
  };

  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service?.name,
    "description": service?.description || `${service?.name} - ავტოსერვისი`,
    "provider": {
      "@type": "Person",
      "name": `${service?.mechanic.first_name} ${service?.mechanic.last_name}`,
      "telephone": service?.mechanic.phone,
      "address": service?.address ? {
        "@type": "PostalAddress",
        "addressLocality": service.city,
        "addressRegion": service.district,
        "streetAddress": service.address
      } : undefined
    },
    "areaServed": {
      "@type": "City",
      "name": service?.city
    },
    "offers": {
      "@type": "Offer",
      "price": service?.price_from || "Price on request",
      "priceCurrency": "GEL",
      "availability": "InStock"
    },
    "aggregateRating": service?.rating ? {
      "@type": "AggregateRating",
      "ratingValue": service.rating,
      "reviewCount": service.review_count || 0,
      "bestRating": 5,
      "worstRating": 1
    } : undefined
  };

  if (loading) {
    return (
      <Layout>
        <Helmet>
          <title>იტვირთება... | AutoMechanico</title>
          <meta name="description" content="ავტოსერვისის ინფორმაცია იტვირთება..." />
        </Helmet>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!service) {
    return (
      <Layout>
        <Helmet>
          <title>სერვისი ვერ მოიძებნა | AutoMechanico</title>
          <meta name="description" content="მოთხოვნილი ავტოსერვისი ვერ მოიძებნა ან აღარ არსებობს." />
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">სერვისი ვერ მოიძებნა</h1>
            <Button onClick={() => navigate("/services")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              სერვისებზე დაბრუნება
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const pageTitle = seoData?.meta_title || `${service.name} - ${service.mechanic.first_name} ${service.mechanic.last_name} | FixUp.ge`;
  const pageDescription = seoData?.meta_description || (service.description 
    ? `${service.description.substring(0, 150)}...`
    : `${service.name} ავტოსერვისი ${service.city}-ში. ხელოსანი: ${service.mechanic.first_name} ${service.mechanic.last_name}. ${service.rating ? `შეფასება: ${service.rating}/5` : ''}`);

  return (
    <Layout>
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        keywords={seoData?.meta_keywords}
        image={service.photos && service.photos.length > 0 ? service.photos[0] : undefined}
        url={`${window.location.origin}/service/${createSlug(service.name)}`}
        type="article"
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-b">
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumbs */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-muted-foreground hover:text-foreground">მთავარი</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/services" className="text-muted-foreground hover:text-foreground">სერვისები</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground">{service.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/services")}
                  className="shrink-0 hover:bg-white/50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  უკან
                </Button>
                {service.category && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {service.category.name}
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
                {seoData?.h1_title || service.name}
              </h1>
              
              {seoData?.h2_description && (
                <h2 className="text-xl text-muted-foreground mb-4 leading-relaxed">
                  {seoData.h2_description}
                </h2>
              )}

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                {service.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-foreground">{service.rating}</span>
                    </div>
                    <span>({service.review_count || 0} შეფასება)</span>
                  </div>
                )}
                
                {service.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{service.city}</span>
                  </div>
                )}
                
                {service.estimated_hours && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{service.estimated_hours} საათი</span>
                  </div>
                )}
              </div>
            </div>

            {/* Price Card */}
            <Card className="shrink-0 w-72 bg-white/80 backdrop-blur-sm border-white/50 shadow-lg hidden lg:block">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary mb-3">
                  {formatPrice(service.price_from, service.price_to)}
                </div>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 shadow-md" 
                  size="lg"
                  onClick={() => navigate(`/book?service=${service.id}`)}
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  დაჯავშვნა
                </Button>
                <div className="flex gap-2 mt-3">
                  {service.mechanic.phone && (
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href={`tel:${service.mechanic.phone}`}>
                        <Phone className="h-4 w-4 mr-1" />
                        დარეკვა
                      </a>
                    </Button>
                  )}
                  <SendMessageButton 
                    mechanicId={service.mechanic.id}
                    mechanicName={`${service.mechanic.first_name} ${service.mechanic.last_name}`}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Image Gallery */}
            {service.photos && service.photos.length > 0 && (
              <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
                <CardContent className="p-0">
                  <div className="aspect-[16/9] relative">
                    <ServiceGallery 
                      photos={service.photos} 
                      serviceName={service.name} 
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Service Description */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">სერვისის აღწერა</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed text-base">
                  {service.description || "აღწერა არ არის მითითებული"}
                </p>
              </CardContent>
            </Card>

            {/* Service Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Features */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50/50 to-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                      სერვისის მახასიათებლები
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <MapPin className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">
                      {service.on_site_service ? "ადგილზე მომსახურება" : "სახელოსნოში მომსახურება"}
                    </span>
                  </div>
                  
                  {service.estimated_hours && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Clock className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium">
                        სავარაუდო დრო: {service.estimated_hours} საათი
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50/50 to-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      გადახდის მეთოდები
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {service.accepts_cash_payment && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Banknote className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium">ნაღდი ფული</span>
                    </div>
                  )}
                  {service.accepts_card_payment && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">საბანკო ბარათი</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Car Brands */}
            {service.car_brands && service.car_brands.length > 0 && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50/50 to-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Car className="h-5 w-5 text-purple-600" />
                    მანქანის მარკები
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {service.car_brands.length >= 15 ? (
                    <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 rounded-full">
                          <Car className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-800">
                            ყველა მარკის ავტომობილი
                          </p>
                          <p className="text-sm text-green-600">
                            სერვისი მოქმედებს ყველა მარკისა და მოდელის ავტომობილზე
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {service.car_brands.map((brand, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary"
                          className="bg-purple-100 text-purple-700 hover:bg-purple-200"
                        >
                          {brand}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Location Map */}
            {service.latitude && service.longitude && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50/50 to-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-orange-600" />
                    ადგილმდებარეობა
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {service.address && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-orange-50 rounded-lg">
                      <MapPin className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">{service.address}</span>
                    </div>
                  )}
                  <div className="rounded-xl overflow-hidden">
                    <LocationMapPicker
                      latitude={service.latitude}
                      longitude={service.longitude}
                      onLocationChange={handleLocationChange}
                      interactive={false}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Videos */}
            {service.videos && service.videos.length > 0 && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50/50 to-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Video className="h-5 w-5 text-red-600" />
                    ვიდეოები
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ServiceVideoGallery 
                    videos={service.videos} 
                    serviceName={service.name} 
                  />
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50/50 to-white">
              <ServiceReviews 
                serviceId={service.id} 
                onReviewAdded={handleReviewAdded}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mechanic Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30 sticky top-6">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-3">
                  <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                    <AvatarImage src="" alt={service.mechanic.first_name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {service.mechanic.first_name.charAt(0)}
                      {service.mechanic.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-lg">
                  {service.mechanic.first_name} {service.mechanic.last_name}
                </CardTitle>
                {service.mechanic.rating && (
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{service.mechanic.rating}</span>
                    <span className="text-muted-foreground text-sm">მექანიკოსი</span>
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Phone Number */}
                {service.mechanic.phone && (
                  <div className="p-3 bg-white/60 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">ტელეფონი</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={togglePhoneVisibility}
                        className="text-xs h-auto p-1"
                      >
                        {showFullPhone ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                    <span className="font-mono text-sm">
                      {showFullPhone ? service.mechanic.phone : maskPhoneNumber(service.mechanic.phone)}
                    </span>
                  </div>
                )}

                {/* Contact Buttons */}
                <div className="space-y-2">
                  {service.mechanic.phone && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={`tel:${service.mechanic.phone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        დარეკვა
                      </a>
                    </Button>
                  )}
                  <SendMessageButton 
                    mechanicId={service.mechanic.id}
                    mechanicName={`${service.mechanic.first_name} ${service.mechanic.last_name}`}
                    variant="outline"
                    className="w-full"
                  />
                  
                  {isValidUUID(service.mechanic.id) && (
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={() => navigate(`/mechanic/${service.mechanic.id}`)}
                    >
                      პროფილის ნახვა
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Location Info */}
            {(service.city || service.district) && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-orange-50/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-orange-600" />
                    მისამართი
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {service.city && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">ქალაქი:</span>
                      <span className="text-muted-foreground">{service.city}</span>
                    </div>
                  )}
                  {service.district && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">რაიონი:</span>
                      <span className="text-muted-foreground">{service.district}</span>
                    </div>
                  )}
                  {service.address && (
                    <div className="text-sm">
                      <span className="font-medium">მისამართი:</span>
                      <p className="text-muted-foreground mt-1">{service.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 lg:hidden z-50 flex flex-col gap-3">
        <Button 
          size="lg"
          className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90"
          onClick={() => navigate(`/book?service=${service.id}`)}
        >
          <Calendar className="h-6 w-6" />
        </Button>
        {service.mechanic.phone && (
          <Button 
            variant="secondary"
            size="lg"
            className="h-12 w-12 rounded-full shadow-xl"
            asChild
          >
            <a href={`tel:${service.mechanic.phone}`}>
              <Phone className="h-5 w-5" />
            </a>
          </Button>
        )}
      </div>
    </Layout>
  );
};

export default ServiceDetail;