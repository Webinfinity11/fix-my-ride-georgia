import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { createSlug } from "@/utils/slugUtils";
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
  ArrowLeft,
  Phone,
  Eye,
  EyeOff,
  Image,
  Video,
  Award,
  CheckCircle,
  MessageSquare,
  Shield,
  Users,
  Calendar,
  Info
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<ServiceType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullPhone, setShowFullPhone] = useState(false);
  
  const { seoData } = useSEOData('service', service?.id.toString() || '');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id) fetchServiceBySlugOrId(id);
  }, [id]);

  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const fetchServiceBySlugOrId = async (slugOrId: string) => {
    setLoading(true);
    
    try {
      let serviceData, serviceError;

      if (/^\d+$/.test(slugOrId)) {
        const result = await supabase
          .from("mechanic_services")
          .select(`
            id, name, description, price_from, price_to, estimated_hours,
            city, district, address, latitude, longitude, car_brands,
            on_site_service, accepts_card_payment, accepts_cash_payment,
            rating, review_count, photos, videos, category_id, mechanic_id,
            service_categories(id, name),
            mechanic_profiles(
              id, rating,
              profiles(id, first_name, last_name, phone)
            )
          `)
          .eq("id", parseInt(slugOrId))
          .eq("is_active", true)
          .single();
        
        serviceData = result.data;
        serviceError = result.error;
      } else {
        const result = await supabase
          .from("mechanic_services")
          .select(`
            id, name, description, price_from, price_to, estimated_hours,
            city, district, address, latitude, longitude, car_brands,
            on_site_service, accepts_card_payment, accepts_cash_payment,
            rating, review_count, photos, videos, category_id, mechanic_id,
            service_categories(id, name),
            mechanic_profiles(
              id, rating,
              profiles(id, first_name, last_name, phone)
            )
          `)
          .eq("is_active", true);
        
        if (result.data) {
          const foundService = result.data.find(service => 
            createSlug(service.name) === slugOrId
          );
          
          if (foundService) {
            serviceData = foundService;
            serviceError = null;
            
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

      if (serviceError || !serviceData) {
        throw new Error("Service not found");
      }

      await processServiceData(serviceData);
      
    } catch (error) {
      console.error("Error fetching service:", error);
      toast.error("სერვისის ჩატვირთვისას შეცდომა დაფიქსირდა");
      navigate("/services");
    } finally {
      setLoading(false);
    }
  };

  const processServiceData = async (serviceData: any) => {
    const category = Array.isArray(serviceData.service_categories) 
      ? serviceData.service_categories[0] 
      : serviceData.service_categories;

    const mechanicProfile = Array.isArray(serviceData.mechanic_profiles) 
      ? serviceData.mechanic_profiles[0] 
      : serviceData.mechanic_profiles;

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

    setService(transformedService);
  };

  const handleReviewAdded = () => {
    if (service && id) {
      fetchServiceBySlugOrId(id);
    }
  };

  const maskPhoneNumber = (phone: string) => {
    if (!phone || phone.length < 3) return phone;
    const maskedPart = phone.slice(0, -3).replace(/\d/g, '●');
    const visiblePart = phone.slice(-3);
    return maskedPart + visiblePart;
  };

  const togglePhoneVisibility = () => {
    setShowFullPhone(!showFullPhone);
  };

  const formatPrice = (priceFrom: number | null, priceTo: number | null) => {
    if (!priceFrom && !priceTo) return null;
    
    if (priceFrom && priceFrom > 0 && priceTo && priceTo > 0 && priceFrom !== priceTo) {
      return `₾${priceFrom} - ₾${priceTo}`;
    }
    
    if (priceFrom && priceFrom > 0) return `₾${priceFrom}`;
    if (priceTo && priceTo > 0) return `₾${priceTo}`;
    
    return null;
  };

  const shouldShowPrice = (priceFrom: number | null, priceTo: number | null) => {
    return formatPrice(priceFrom, priceTo) !== null;
  };

  const handleLocationChange = () => {
    // Read-only map display
  };

  // Loading State
  if (loading) {
    return (
      <Layout>
        <Helmet>
          <title>იტვირთება... | AutoMechanico</title>
          <meta name="description" content="ავტოსერვისის ინფორმაცია იტვირთება..." />
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-8">
              <div className="flex gap-4">
                <div className="h-10 w-20 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-200 rounded-lg w-2/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-3 space-y-6">
                  <div className="h-96 bg-gray-200 rounded-2xl"></div>
                  <div className="h-64 bg-gray-200 rounded-2xl"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-32 bg-gray-200 rounded-2xl"></div>
                  <div className="h-48 bg-gray-200 rounded-2xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Not Found State
  if (!service) {
    return (
      <Layout>
        <Helmet>
          <title>სერვისი ვერ მოიძებნა | AutoMechanico</title>
          <meta name="description" content="მოთხოვნილი ავტოსერვისი ვერ მოიძებნა ან აღარ არსებობს." />
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center space-y-6 max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <Info className="h-12 w-12 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">სერვისი ვერ მოიძებნა</h1>
              <p className="text-gray-600">მოთხოვნილი სერვისი ვერ მოიძებნა ან აღარ არსებობს</p>
              <Button 
                onClick={() => navigate("/services")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                სერვისებზე დაბრუნება
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

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

  // Contact Card Component
  const ContactCard = ({ className = "" }: { className?: string }) => (
    <Card className={`${className} shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg font-bold">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md">
            <Award className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            მექანიკოსი
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 ring-4 ring-blue-100 shadow-lg">
              <AvatarImage src="" alt={service.mechanic.first_name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                {service.mechanic.first_name.charAt(0)}
                {service.mechanic.last_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 shadow-md">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-lg text-gray-900 leading-tight">
              {service.mechanic.first_name} {service.mechanic.last_name}
            </h4>
            {service.mechanic.rating && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-yellow-700">{service.mechanic.rating}</span>
                </div>
                <span className="text-xs text-gray-500">შეფასება</span>
              </div>
            )}
          </div>
        </div>

        {service.mechanic.phone && (
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Phone className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-mono text-sm font-medium text-gray-800">
                  {showFullPhone ? service.mechanic.phone : maskPhoneNumber(service.mechanic.phone)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePhoneVisibility}
                className="h-8 px-3 text-xs hover:bg-blue-100 rounded-lg transition-colors"
              >
                {showFullPhone ? (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    დამალვა
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    ნახვა
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {service.mechanic.phone && (
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 transition-all duration-200"
            >
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
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
          />
        </div>

        {isValidUUID(service.mechanic.id) ? (
          <Button 
            variant="default"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
            onClick={() => navigate(`/mechanic/${service.mechanic.id}`)}
          >
            <Users className="mr-2 h-4 w-4" />
            სრული პროფილი
          </Button>
        ) : (
          <div className="text-center text-sm text-gray-500 py-3 bg-gray-50 rounded-lg">
            პროფილი დროებით მიუწვდომელია
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Price Card Component
  const PriceCard = ({ className = "" }: { className?: string }) => {
    const priceDisplay = formatPrice(service.price_from, service.price_to);
    
    if (!priceDisplay) return null;

    return (
      <Card className={`${className} shadow-lg border-0 bg-gradient-to-br from-blue-50 to-purple-50 hover:shadow-xl transition-all duration-300`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {priceDisplay}
            </CardTitle>
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </div>
          {service.rating && (
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-yellow-700">{service.rating}</span>
              </div>
              <span className="text-sm text-gray-600">
                ({service.review_count || 0} შეფასება)
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 text-lg py-6"
            size="lg"
            onClick={() => navigate(`/book?service=${service.id}`)}
          >
            <Calendar className="mr-3 h-5 w-5" />
            ახლავე დაჯავშვნა
          </Button>
          
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center group cursor-pointer">
              <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors duration-200 mb-2">
                <Shield className="h-6 w-6 text-green-600 mx-auto" />
              </div>
              <span className="text-xs font-medium text-gray-600">100% დაცული</span>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors duration-200 mb-2">
                <CheckCircle className="h-6 w-6 text-blue-600 mx-auto" />
              </div>
              <span className="text-xs font-medium text-gray-600">გარანტია</span>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors duration-200 mb-2">
                <Award className="h-6 w-6 text-purple-600 mx-auto" />
              </div>
              <span className="text-xs font-medium text-gray-600">ხარისხი</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Rating Card Component
  const RatingCard = ({ className = "" }: { className?: string }) => {
    if (!service.rating && !service.review_count) return null;

    return (
      <Card className={`${className} shadow-lg border-0 bg-gradient-to-br from-yellow-50 to-orange-50 hover:shadow-xl transition-all duration-300`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-bold">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-md">
              <Star className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              შეფასება
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {service.rating && (
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                  <span className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    {service.rating}
                  </span>
                </div>
                <span className="text-sm text-gray-600 font-medium">
                  {service.review_count || 0} შეფასებიდან
                </span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center group cursor-pointer">
              <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors duration-200 mb-2">
                <Shield className="h-6 w-6 text-green-600 mx-auto" />
              </div>
              <span className="text-xs font-medium text-gray-600">100% დაცული</span>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors duration-200 mb-2">
                <CheckCircle className="h-6 w-6 text-blue-600 mx-auto" />
              </div>
              <span className="text-xs font-medium text-gray-600">გარანტია</span>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors duration-200 mb-2">
                <Award className="h-6 w-6 text-purple-600 mx-auto" />
              </div>
              <span className="text-xs font-medium text-gray-600">ხარისხი</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          {/* Breadcrumbs */}
          <Breadcrumb className="mb-6 lg:mb-8">
            <BreadcrumbList className="text-sm">
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                  მთავარი
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-gray-400" />
              <BreadcrumbItem>
                <BreadcrumbLink href="/services" className="text-gray-600 hover:text-blue-600 transition-colors">
                  სერვისები
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-gray-400" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-900 font-medium">
                  {service.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 mb-8 lg:mb-12">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/services")}
              className="self-start bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:border-blue-300 transition-all duration-200 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              უკან
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 lg:mb-4 leading-tight">
                {seoData?.h1_title || service.name}
              </h1>
              {seoData?.h2_description && (
                <h2 className="text-lg lg:text-xl text-gray-600 mb-4 leading-relaxed">
                  {seoData.h2_description}
                </h2>
              )}
              <div className="flex flex-wrap gap-2 lg:gap-3">
                {service.category && (
                  <Badge 
                    variant="secondary" 
                    className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-0 px-3 py-1 text-sm font-medium hover:from-blue-200 hover:to-purple-200 transition-all duration-200"
                  >
                    {service.category.name}
                  </Badge>
                )}
                {service.on_site_service && (
                  <Badge 
                    variant="outline" 
                    className="bg-green-50 text-green-700 border-green-200 px-3 py-1 text-sm font-medium hover:bg-green-100 transition-all duration-200"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    ადგილზე მომსახურება
                  </Badge>
                )}
                {!shouldShowPrice(service.price_from, service.price_to) && (
                  <Badge 
                    variant="outline" 
                    className="bg-orange-50 text-orange-700 border-orange-200 px-3 py-1 text-sm font-medium hover:bg-orange-100 transition-all duration-200"
                  >
                    <Info className="h-3 w-3 mr-1" />
                    ფასი შეთანხმებით
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="xl:col-span-3 space-y-6 lg:space-y-8">
              {/* Mobile Sidebar Cards */}
              <div className="xl:hidden space-y-4 lg:space-y-6">
                {shouldShowPrice(service.price_from, service.price_to) ? (
                  <PriceCard />
                ) : (
                  <RatingCard />
                )}
                <ContactCard />
              </div>

              {/* Service Photos */}
              {service.photos && service.photos.length > 0 && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                        <Image className="h-5 w-5 text-white" />
                      </div>
                      <span>სურათები ({service.photos.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 lg:p-6">
                    <div className="max-w-5xl">
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
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold">
                      <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-md">
                        <Video className="h-5 w-5 text-white" />
                      </div>
                      <span>ვიდეოები ({service.videos.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 lg:p-6">
                    <div className="max-w-5xl">
                      <ServiceVideoGallery 
                        videos={service.videos} 
                        serviceName={service.name} 
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Service Description */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-md">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <span>სერვისის აღწერა</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 lg:p-6">
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                      {service.description || "დეტალური აღწერა არ არის მითითებული"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Service Details */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-md">
                      <Info className="h-5 w-5 text-white" />
                    </div>
                    <span>დეტალები</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 lg:p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    <div className="flex items-center gap-4 p-4 lg:p-5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-blue-900 mb-1">სამუშაოს ხანგრძლივობა</div>
                        <div className="text-gray-700 font-medium">
                          {service.estimated_hours ? `${service.estimated_hours} საათი` : "შეთანხმებით"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 lg:p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                      <div className="p-3 bg-green-100 rounded-xl">
                        <MapPin className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-green-900 mb-1">მომსახურების ადგილი</div>
                        <div className="text-gray-700 font-medium">
                          {service.on_site_service ? "ადგილზე მომსახურება" : "სახელოსნოში"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Payment Methods */}
                  <div>
                    <h4 className="font-bold text-lg mb-4 text-gray-900">გადახდის მეთოდები</h4>
                    <div className="flex flex-wrap gap-3">
                      {service.accepts_cash_payment && (
                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                          <Banknote className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-700">ნაღდი ანგარიშსწორება</span>
                        </div>
                      )}
                      {service.accepts_card_payment && (
                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-blue-700">ბარათით გადახდა</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Car Brands */}
                  {service.car_brands && service.car_brands.length > 0 && (
                    <>
                      <Separator className="my-6" />
                      <div>
                        <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900">
                          <Car className="h-5 w-5" />
                          მხარდაჭერილი მანქანის მარკები
                        </h4>
                        {service.car_brands.length >= 15 ? (
                          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                              </div>
                              <span className="text-lg font-semibold text-green-800">
                                ყველა მარკის ავტომობილზე მუშაობა
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-3">
                            {service.car_brands.map((brand, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                className="bg-gray-100 text-gray-800 border-0 px-3 py-2 text-sm font-medium hover:bg-gray-200 transition-colors"
                              >
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

            {/* Desktop Sidebar */}
            <div className="hidden xl:block space-y-6">
              {/* Price or Rating Card */}
              {shouldShowPrice(service.price_from, service.price_to) ? (
                <PriceCard />
              ) : (
                <RatingCard />
              )}
              
              {/* Contact Card */}
              <ContactCard />
              
              {/* Location Info */}
              {(service.city || service.district) && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg font-bold">
                      <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <span>მისამართი</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {service.city && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 font-medium">ქალაქი:</span>
                        <span className="font-bold text-gray-900">{service.city}</span>
                      </div>
                    )}
                    {service.district && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 font-medium">რაიონი:</span>
                        <span className="font-bold text-gray-900">{service.district}</span>
                      </div>
                    )}
                    {service.address && (
                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-gray-600 font-medium block mb-2">მისამართი:</span>
                        <span className="font-semibold text-gray-900 text-sm leading-relaxed">
                          {service.address}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Location Map */}
              {service.latitude && service.longitude && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg font-bold">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl shadow-md">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <span>ადგილმდებარეობა</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="rounded-b-xl overflow-hidden border-t border-gray-100">
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
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ServiceDetail;