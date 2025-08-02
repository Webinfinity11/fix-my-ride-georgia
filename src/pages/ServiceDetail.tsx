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
    "name": service.name,
    "description": service.description || `${service.name} - ავტოსერვისი`,
    "provider": {
      "@type": "Person",
      "name": `${service.mechanic.first_name} ${service.mechanic.last_name}`,
      "telephone": service.mechanic.phone,
      "address": service.address ? {
        "@type": "PostalAddress",
        "addressLocality": service.city,
        "addressRegion": service.district,
        "streetAddress": service.address
      } : undefined
    },
    "areaServed": {
      "@type": "City",
      "name": service.city
    },
    "offers": {
      "@type": "Offer",
      "price": service.price_from || "Price on request",
      "priceCurrency": "GEL",
      "availability": "InStock"
    },
    "aggregateRating": service.rating ? {
      "@type": "AggregateRating",
      "ratingValue": service.rating,
      "reviewCount": service.review_count || 0,
      "bestRating": 5,
      "worstRating": 1
    } : undefined
  };

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

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">მთავარი</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/services">სერვისები</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{service.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/services")}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            უკან
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {seoData?.h1_title || service.name}
            </h1>
            {seoData?.h2_description && (
              <h2 className="text-lg text-gray-600 mt-2 mb-3">
                {seoData.h2_description}
              </h2>
            )}
            {service.category && (
              <Badge variant="secondary" className="mt-2">
                {service.category.name}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            {/* Mobile Mechanic Info - Only visible on mobile */}
            <Card className="lg:hidden">
              <CardHeader>
                <CardTitle>მექანიკოსი</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="" alt={service.mechanic.first_name} />
                    <AvatarFallback>
                      {service.mechanic.first_name.charAt(0)}
                      {service.mechanic.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">
                      {service.mechanic.first_name} {service.mechanic.last_name}
                    </h4>
                    {service.mechanic.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{service.mechanic.rating}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Phone Number Display */}
                {service.mechanic.phone && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="font-mono text-sm">
                          {showFullPhone ? service.mechanic.phone : maskPhoneNumber(service.mechanic.phone)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={togglePhoneVisibility}
                        className="text-xs"
                      >
                        {showFullPhone ? "დამალვა" : "ნომრის ნახვა"}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {service.mechanic.phone && (
                    <Button variant="outline" size="sm" className="flex-1" asChild>
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
                    size="sm"
                    className="flex-1"
                  />
                </div>

                {/* Only show profile link if mechanic ID is valid UUID */}
                {isValidUUID(service.mechanic.id) ? (
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => navigate(`/mechanic/${service.mechanic.id}`)}
                  >
                    პროფილის ნახვა
                  </Button>
                ) : (
                  <div className="text-center text-sm text-muted-foreground">
                    ხელოსნის პროფილი მიუწვდომელია
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Photos */}
            {service.photos && service.photos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    ფოტოები
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 lg:p-6">
                  <div className="max-w-2xl">
                    <ServiceGallery 
                      photos={service.photos} 
                      serviceName={service.name} 
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Service Videos */}
            {service.videos && service.videos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    ვიდეოები
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 lg:p-6">
                  <ServiceVideoGallery 
                    videos={service.videos} 
                    serviceName={service.name} 
                  />
                </CardContent>
              </Card>
            )}

            {/* Service Description */}
            <Card>
              <CardHeader>
                <CardTitle>სერვისის აღწერა</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  {service.description || "აღწერა არ არის მითითებული"}
                </p>
              </CardContent>
            </Card>

            {/* Location Map - Moved here between description and service details */}
            {service.latitude && service.longitude && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    ადგილმდებარეობა
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {service.address && (
                    <p className="text-sm text-gray-600 mb-4">
                      📍 {service.address}
                    </p>
                  )}
                  <LocationMapPicker
                    latitude={service.latitude}
                    longitude={service.longitude}
                    onLocationChange={handleLocationChange}
                    interactive={false}
                  />
                </CardContent>
              </Card>
            )}

            {/* Mobile Location Info - Only visible on mobile */}
            {(service.city || service.district) && (
              <Card className="lg:hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    მისამართი
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {service.city && (
                      <div>
                        <span className="font-medium">ქალაქი:</span> {service.city}
                      </div>
                    )}
                    {service.district && (
                      <div>
                        <span className="font-medium">რაიონი:</span> {service.district}
                      </div>
                    )}
                    {service.address && (
                      <div>
                        <span className="font-medium">მისამართი:</span> {service.address}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mobile Price & Booking - Only visible on mobile */}
            <Card className="lg:hidden">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">
                  {formatPrice(service.price_from, service.price_to)}
                </CardTitle>
                {service.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{service.rating}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ({service.review_count || 0} შეფასება)
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate(`/book?service=${service.id}`)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  დაჯავშვნა
                </Button>
              </CardContent>
            </Card>


            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle>სერვისის დეტალები</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      სავარაუდო დრო: {service.estimated_hours ? `${service.estimated_hours} საათი` : "არ არის მითითებული"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {service.on_site_service ? "ადგილზე მომსახურება" : "სახელოსნოში მომსახურება"}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Payment Methods */}
                <div>
                  <h4 className="font-medium mb-2">გადახდის მეთოდები</h4>
                  <div className="flex gap-2">
                    {service.accepts_cash_payment && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Banknote className="h-3 w-3" />
                        ნაღდი
                      </Badge>
                    )}
                    {service.accepts_card_payment && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        ბარათი
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Car Brands */}
                {service.car_brands && service.car_brands.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        მანქანის მარკები
                      </h4>
                      {service.car_brands.length >= 15 ? (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-700 font-medium">
                            🚗 სერვისი მოქმედებს ყველა მარკის ავტომობილზე
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {service.car_brands.map((brand, index) => (
                            <Badge key={index} variant="secondary">
                              {brand}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Service Reviews */}
            <ServiceReviews 
              serviceId={service.id} 
              onReviewAdded={handleReviewAdded}
            />
          </div>

          {/* Desktop Sidebar - Hidden on mobile */}
          <div className="space-y-6 order-1 lg:order-2 hidden lg:block">
            {/* Price & Booking */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-primary">
                  {formatPrice(service.price_from, service.price_to)}
                </CardTitle>
                {service.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{service.rating}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ({service.review_count || 0} შეფასება)
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate(`/book?service=${service.id}`)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  დაჯავშვნა
                </Button>
              </CardContent>
            </Card>

            {/* Mechanic Info */}
            <Card>
              <CardHeader>
                <CardTitle>მექანიკოსი</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="" alt={service.mechanic.first_name} />
                    <AvatarFallback>
                      {service.mechanic.first_name.charAt(0)}
                      {service.mechanic.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">
                      {service.mechanic.first_name} {service.mechanic.last_name}
                    </h4>
                    {service.mechanic.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{service.mechanic.rating}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Phone Number Display */}
                {service.mechanic.phone && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="font-mono text-sm">
                          {showFullPhone ? service.mechanic.phone : maskPhoneNumber(service.mechanic.phone)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={togglePhoneVisibility}
                        className="text-xs"
                      >
                        {showFullPhone ? "დამალვა" : "ნომრის ნახვა"}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {service.mechanic.phone && (
                    <Button variant="outline" size="sm" className="flex-1" asChild>
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
                    size="sm"
                    className="flex-1"
                  />
                </div>

                {/* Only show profile link if mechanic ID is valid UUID */}
                {isValidUUID(service.mechanic.id) ? (
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => navigate(`/mechanic/${service.mechanic.id}`)}
                  >
                    პროფილის ნახვა
                  </Button>
                ) : (
                  <div className="text-center text-sm text-muted-foreground">
                    ხელოსნის პროფილი მიუწვდომელია
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location Info */}
            {(service.city || service.district) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    მისამართი
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {service.city && (
                      <div>
                        <span className="font-medium">ქალაქი:</span> {service.city}
                      </div>
                    )}
                    {service.district && (
                      <div>
                        <span className="font-medium">რაიონი:</span> {service.district}
                      </div>
                    )}
                    {service.address && (
                      <div>
                        <span className="font-medium">მისამართი:</span> {service.address}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ServiceDetail;
