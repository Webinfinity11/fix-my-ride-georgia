import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { performRedirect, needsCanonicalRedirect } from "@/utils/redirectUtils";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { createSlug, createMechanicSlug } from "@/utils/slugUtils";
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
  Navigation
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
import { ServiceSchema, BreadcrumbSchema, ProductSchema, FAQSchema } from "@/components/seo/StructuredData";
import { generateServiceOGImage } from "@/utils/ogImageGenerator";
import { generateSEOTitle, generateSEODescription, generateCanonicalURL } from "@/utils/seoUtils";
import { ServiceShareButtons } from "@/components/services/ServiceShareButtons";
import { SaveServiceButton } from "@/components/services/SaveServiceButton";

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
    display_id?: number;
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
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
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

      // Check for ID-slug format (e.g., "425-slug-name")
      const idSlugMatch = slugOrId.match(/^(\d+)-(.+)$/);
      const isNumericId = /^\d+$/.test(slugOrId);
      
      if (isNumericId || idSlugMatch) {
        // Fetch by ID (either pure ID or extracted from ID-slug format)
        const serviceId = idSlugMatch ? parseInt(idSlugMatch[1]) : parseInt(slugOrId);
        const result = await supabase
          .from("mechanic_services")
          .select(`
            id, name, description, price_from, price_to, estimated_hours,
            city, district, address, latitude, longitude, car_brands,
            on_site_service, accepts_card_payment, accepts_cash_payment,
            rating, review_count, photos, videos, category_id, mechanic_id,
            service_categories(id, name),
            mechanic_profiles(
              display_id, rating,
              profiles(id, first_name, last_name, phone)
            )
          `)
          .eq("id", serviceId)
          .eq("is_active", true)
          .single();
        
        serviceData = result.data;
        serviceError = result.error;
        
        // If we found the service and it was accessed via ID-slug format, 
        // redirect to canonical URL if needed
        if (!serviceError && serviceData && idSlugMatch) {
          const correctSlug = `${serviceData.id}-${createSlug(serviceData.name)}`;
          if (needsCanonicalRedirect(slugOrId, correctSlug)) {
            performRedirect(navigate, `/service/${correctSlug}`, { permanent: true });
            return; // Stop processing to prevent double navigation
          }
        }
      } else {
        // Fetch by legacy slug
        const result = await supabase
          .from("mechanic_services")
          .select(`
            id, name, description, price_from, price_to, estimated_hours,
            city, district, address, latitude, longitude, car_brands,
            on_site_service, accepts_card_payment, accepts_cash_payment,
            rating, review_count, photos, videos, category_id, mechanic_id,
            service_categories(id, name),
            mechanic_profiles(
              display_id, rating,
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
            
            // Redirect to canonical ID-slug format for SEO
            const newSlug = `${foundService.id}-${createSlug(foundService.name)}`;
            performRedirect(navigate, `/service/${newSlug}`, { permanent: true });
            return; // Stop processing to prevent double navigation
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
      display_id: undefined as number | undefined,
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
        display_id: mechanicProfile?.display_id || undefined,
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
    const maskedPart = phone.slice(0, -3).replace(/\d/g, '*');
    const visiblePart = phone.slice(-3);
    return maskedPart + visiblePart;
  };

  const trackPhoneView = async (serviceId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('service_phone_views')
        .insert({
          service_id: serviceId,
          viewer_id: user?.id || null,
          user_agent: navigator.userAgent
        });

      if (error) {
        console.error('Error tracking phone view:', error);
      }
    } catch (err) {
      console.error('Error tracking phone view:', err);
    }
  };

  const togglePhoneVisibility = async () => {
    // თუ ნომერი დამალულია და ვაპირებთ ჩვენებას, track phone view
    if (!showFullPhone && service) {
      await trackPhoneView(service.id);
    }
    
    setShowFullPhone(!showFullPhone);
  };

  const formatPrice = (priceFrom: number | null, priceTo: number | null) => {
    if (!priceFrom && !priceTo) return null; // Return null instead of "ფასი შეთანხმებით"
    
    if (priceFrom && priceFrom > 0 && priceTo && priceTo > 0 && priceFrom !== priceTo) {
      return `₾${priceFrom} - ₾${priceTo}`;
    }
    
    if (priceFrom && priceFrom > 0) return `₾${priceFrom}`;
    if (priceTo && priceTo > 0) return `₾${priceTo}`;
    
    return null; // Return null instead of "ფასი შეთანხმებით"
  };

  // Check if price should be displayed
  const shouldShowPrice = (priceFrom: number | null, priceTo: number | null) => {
    return formatPrice(priceFrom, priceTo) !== null;
  };

  const handleLocationChange = () => {
    // Read-only map display
  };

  const handleGetDirections = () => {
    if (service && service.latitude && service.longitude) {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${service.latitude},${service.longitude}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  // Loading State
  if (loading) {
    return (
      <Layout>
        <Helmet>
          <title>იტვირთება... | AutoMechanico</title>
          <meta name="description" content="ავტოსერვისის ინფორმაცია იტვირთება..." />
        </Helmet>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
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
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">სერვისი ვერ მოიძებნა</h1>
            <Button onClick={() => navigate("/services")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              სერვისებზე დაბრუნება
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

      const pageTitle = seoData?.meta_title || generateSEOTitle('service', {
        name: service.name,
        city: service.city,
        mechanic: { name: `${service.mechanic.first_name} ${service.mechanic.last_name}` }
      });
      
      const pageDescription = seoData?.meta_description || generateSEODescription('service', {
        name: service.name,
        city: service.city,
        mechanic: { name: `${service.mechanic.first_name} ${service.mechanic.last_name}` },
        rating: service.rating,
        description: service.description
      });

      const canonicalUrl = generateCanonicalURL('service', {
        id: service.id,
        name: service.name
      });

  // Generate breadcrumb items for SEO
  const breadcrumbItems = [
    { name: 'მთავარი', url: 'https://fixup.ge/' },
    { name: 'სერვისები', url: 'https://fixup.ge/services' },
    ...(service.category ? [{ name: service.category.name, url: `https://fixup.ge/category/${service.category.id}` }] : []),
    { name: service.name, url: canonicalUrl }
  ];

  // Contact Card Component
  const ContactCard = ({ className = "" }: { className?: string }) => (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          მექანიკოსი
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src="" alt={`${service.mechanic.first_name} ${service.mechanic.last_name}`} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {service.mechanic.first_name.charAt(0)}
              {service.mechanic.last_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-gray-900">
              {service.mechanic.first_name} {service.mechanic.last_name}
            </h4>
            {service.mechanic.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{service.mechanic.rating}</span>
                <span className="text-xs text-gray-500">შეფასება</span>
              </div>
            )}
          </div>
        </div>

        {service.mechanic.phone && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
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
                className="h-8 px-2 text-xs"
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

        <div className="grid grid-cols-2 gap-2">
          {service.mechanic.phone && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={async (e) => {
                e.preventDefault();
                await trackPhoneView(service.id);
                window.location.href = `tel:${service.mechanic.phone}`;
              }}
            >
              <Phone className="h-4 w-4 mr-1" />
              დარეკვა
            </Button>
          )}
          <SendMessageButton 
            mechanicId={service.mechanic.id}
            mechanicName={`${service.mechanic.first_name} ${service.mechanic.last_name}`}
            variant="outline"
            size="sm"
          />
        </div>

        {isValidUUID(service.mechanic.id) ? (
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={() => navigate(`/mechanic/${createMechanicSlug(service.mechanic.display_id || 0, service.mechanic.first_name, service.mechanic.last_name)}`)}
          >
            სრული პროფილი
          </Button>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-2">
            პროფილი მიუწვდომელია
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Price Card Component - Only show if price is available
  const PriceCard = ({ className = "" }: { className?: string }) => {
    const priceDisplay = formatPrice(service.price_from, service.price_to);
    
    if (!priceDisplay) {
      return null; // Don't render the card if no price
    }

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-2xl text-primary font-bold">
            {priceDisplay}
          </CardTitle>
          {service.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{service.rating}</span>
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
            დაჯავშვნა
          </Button>
          
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="text-center">
              <CheckCircle className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <span className="text-xs text-gray-600">დაცული</span>
            </div>
            <div className="text-center">
              <CheckCircle className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <span className="text-xs text-gray-600">გარანტია</span>
            </div>
            <div className="text-center">
              <Award className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <span className="text-xs text-gray-600">ხარისხი</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Rating Card Component - Show only rating when no price
  const RatingCard = ({ className = "" }: { className?: string }) => {
    if (!service.rating && !service.review_count) {
      return null; // Don't show if no rating data
    }

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            შეფასება
          </CardTitle>
        </CardHeader>
        <CardContent>
          {service.rating && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold text-primary">{service.rating}</span>
              </div>
              <span className="text-gray-500">
                ({service.review_count || 0} შეფასება)
              </span>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <CheckCircle className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <span className="text-xs text-gray-600">დაცული</span>
            </div>
            <div className="text-center">
              <CheckCircle className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <span className="text-xs text-gray-600">გარანტია</span>
            </div>
            <div className="text-center">
              <Award className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <span className="text-xs text-gray-600">ხარისხი</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Generate FAQ data for schema
  const serviceFAQs = [
    {
      question: `რა არის ${service.name}-ის ფასი?`,
      answer: formatPrice(service.price_from, service.price_to) || 'ფასი შეთანხმებით'
    },
    {
      question: `რამდენი დრო სჭირდება ${service.name}-ს?`,
      answer: service.estimated_hours ? `დაახლოებით ${service.estimated_hours} საათი` : 'დრო შეთანხმებით'
    },
    {
      question: `სად მდებარეობს ${service.name} სერვისი?`,
      answer: `${service.city}${service.district ? `, ${service.district} რაიონი` : ''}${service.address ? `, ${service.address}` : ''}`
    },
    ...(service.on_site_service ? [{
      question: 'არის თუ არა ადგილზე მომსახურება?',
      answer: 'დიახ, ხელოსანი შეასრულებს სამუშაოს თქვენი მისამართით.'
    }] : []),
    {
      question: `რა გადახდის მეთოდებს იღებს ${service.mechanic.first_name} ${service.mechanic.last_name}?`,
      answer: [
        service.accepts_cash_payment ? 'ნაღდი' : null,
        service.accepts_card_payment ? 'საბანკო ბარათი' : null
      ].filter(Boolean).join(', ') || 'ნაღდი გადახდა'
    }
  ];

  return (
    <Layout>
        <SEOHead
          title={pageTitle}
          description={pageDescription}
          keywords={seoData?.meta_keywords || `${service.name}, ავტოსერვისი, ${service.city}, ${service.mechanic.first_name} ${service.mechanic.last_name}, მექანიკოსი`}
          image={generateServiceOGImage(service)}
          url={canonicalUrl}
          canonical={canonicalUrl}
          type="article"
        />
        
        {/* Rich Product Schema for better Google Rich Results */}
        <ProductSchema
          name={service.name}
          description={service.description || `${service.name} - პროფესიონალური ავტოსერვისი ${service.city}-ში`}
          image={service.photos || undefined}
          brand="ავტოხელოსანი"
          category={service.category?.name}
          offers={{
            price: service.price_from || "შეთანხმებით",
            priceCurrency: "GEL",
            availability: "InStock",
            seller: {
              name: `${service.mechanic.first_name} ${service.mechanic.last_name}`,
              telephone: service.mechanic.phone || undefined,
              address: service.address ? {
                "@type": "PostalAddress",
                addressLocality: service.city,
                addressRegion: service.district,
                streetAddress: service.address
              } : undefined
            }
          }}
          aggregateRating={service.rating ? {
            ratingValue: service.rating,
            reviewCount: service.review_count || 0
          } : undefined}
        />
        
        {/* Service Schema for compatibility */}
        <ServiceSchema
          name={service.name}
          description={service.description || `${service.name} - ავტოსერვისი`}
          provider={{
            name: `${service.mechanic.first_name} ${service.mechanic.last_name}`,
            telephone: service.mechanic.phone,
            address: service.address ? {
              "@type": "PostalAddress",
              addressLocality: service.city,
              addressRegion: service.district,
              streetAddress: service.address
            } : undefined
          }}
          areaServed={service.city}
          offers={{
            price: service.price_from || "Price on request",
            priceCurrency: "GEL",
            availability: "InStock"
          }}
          aggregateRating={service.rating ? {
            ratingValue: service.rating,
            reviewCount: service.review_count || 0
          } : undefined}
        />
        
        {/* FAQ Schema for common questions */}
        <FAQSchema faqs={serviceFAQs} />
        
        <BreadcrumbSchema items={breadcrumbItems} />

      <div className="container mx-auto px-4 py-6">
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
        <div className="flex items-start gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/services")}
            className="shrink-0 mt-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            უკან
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {seoData?.h1_title || service.name}
            </h1>
            {seoData?.h2_description && (
              <h2 className="text-lg text-gray-600 mb-3">
                {seoData.h2_description}
              </h2>
            )}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {service.category && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {service.category.name}
                </Badge>
              )}
              {service.on_site_service && (
                <Badge variant="outline">
                  ადგილზე მომსახურება
                </Badge>
              )}
              {!shouldShowPrice(service.price_from, service.price_to) && (
                <Badge variant="outline">
                  ფასი შეთანხმებით
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ServiceShareButtons 
                serviceName={service.name}
                serviceUrl={canonicalUrl}
                serviceDescription={service.description || undefined}
              />
              <SaveServiceButton serviceId={service.id} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mobile Contact & Price/Rating - Only visible on mobile */}
            <div className="lg:hidden space-y-4">
              {shouldShowPrice(service.price_from, service.price_to) ? (
                <PriceCard />
              ) : (
                <RatingCard />
              )}
              <ContactCard />
            </div>

            {/* Service Photos */}
            {service.photos && service.photos.length > 0 && (
              <div className="lg:bg-card/30 lg:backdrop-blur-sm lg:rounded-xl lg:border lg:border-border/40 lg:overflow-hidden">
                {/* Mobile version - keep as card */}
                <div className="lg:hidden">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        სურათები ({service.photos.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <ServiceGallery 
                        photos={service.photos} 
                        serviceName={service.name} 
                      />
                    </CardContent>
                  </Card>
                </div>
                
                {/* Desktop version - modern design without title */}
                <div className="hidden lg:block lg:p-6">
                  <ServiceGallery 
                    photos={service.photos} 
                    serviceName={service.name} 
                  />
                </div>
              </div>
            )}

            {/* Service Videos */}
            {service.videos && service.videos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    ვიდეოები ({service.videos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="max-w-4xl">
                    <ServiceVideoGallery 
                      videos={service.videos} 
                      serviceName={service.name} 
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Service Description */}
            <Card>
              <CardHeader>
                <CardTitle>სერვისის აღწერა</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {service.description || "დეტალური აღწერა არ არის მითითებული"}
                </p>
              </CardContent>
            </Card>

            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle>დეტალები</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <div className="text-sm font-medium">დრო</div>
                      <div className="text-sm text-gray-600">
                        {service.estimated_hours ? `${service.estimated_hours} საათი` : "შეთანხმებით"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <div className="text-sm font-medium">ადგილი</div>
                       <div className="text-sm text-gray-600">
                         {service.city && service.district ? `${service.city}, ${service.district}` : service.city}
                         {service.address && (
                           <div className="mt-1">{service.address}</div>
                         )}
                       </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payment Methods */}
                <div>
                  <h4 className="font-medium mb-3">გადახდის მეთოდები</h4>
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
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        მანქანის მარკები
                      </h4>
                      {service.car_brands.length >= 15 ? (
                        <div className="p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-gray-600" />
                            <span className="text-sm text-gray-700 font-medium">
                              ყველა მარკის ავტომობილზე მუშაობა
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {service.car_brands.map((brand, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
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

            {/* Mobile Location Map - Only visible on mobile */}
            {service.latitude && service.longitude && (
              <Card className="lg:hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    ადგილმდებარეობა
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {service.address && (
                    <p className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">
                      📍 {service.address}
                    </p>
                  )}
                  <div className="rounded-lg overflow-hidden border mb-4">
                    <LocationMapPicker
                      latitude={service.latitude}
                      longitude={service.longitude}
                      onLocationChange={handleLocationChange}
                      interactive={false}
                    />
                  </div>
                  <Button 
                    onClick={handleGetDirections}
                    className="w-full"
                    variant="outline"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    მარშრუტის ნახვა
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Desktop Sidebar - Hidden on mobile */}
          <div className="space-y-6 hidden lg:block">
            {/* Show Price Card if available, otherwise show Rating Card */}
            {shouldShowPrice(service.price_from, service.price_to) ? (
              <PriceCard />
            ) : (
              <RatingCard />
            )}
            
            <ContactCard />
            
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
                  <div className="space-y-3">
                    {service.city && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">ქალაქი:</span>
                        <span className="font-medium">{service.city}</span>
                      </div>
                    )}
                    {service.district && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">რაიონი:</span>
                        <span className="font-medium">{service.district}</span>
                      </div>
                    )}
                    {service.address && (
                      <div>
                        <span className="text-gray-600 block mb-1">მისამართი:</span>
                        <span className="font-medium text-sm">{service.address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location Map */}
            {service.latitude && service.longitude && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    ადგილმდებარეობა
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="rounded-lg overflow-hidden border mb-4">
                    <LocationMapPicker
                      latitude={service.latitude}
                      longitude={service.longitude}
                      onLocationChange={handleLocationChange}
                      interactive={false}
                    />
                  </div>
                  <Button 
                    onClick={handleGetDirections}
                    className="w-full"
                    variant="outline"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    მარშრუტის ნახვა
                  </Button>
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