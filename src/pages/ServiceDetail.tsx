import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { performRedirect, needsCanonicalRedirect } from "@/utils/redirectUtils";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { createSlug, createMechanicSlug, createCategorySlug } from "@/utils/slugUtils";
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
  Navigation,
  Heart,
  Share2,
  Flag,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Home,
  ArrowRight,
  Wrench
} from "lucide-react";
import { toast } from "sonner";
import LocationMapPicker from "@/components/forms/LocationMapPicker";
import ServiceReviews from "@/components/reviews/ServiceReviews";
import ServiceGallery from "@/components/services/ServiceGallery";
import ServiceVideoGallery from "@/components/services/ServiceVideoGallery";
import Layout from "@/components/layout/Layout";
import { useSEOData } from "@/hooks/useSEOData";
import SEOHead from "@/components/seo/SEOHead";
import { ServiceSchema, BreadcrumbSchema, ProductSchema, FAQSchema } from "@/components/seo/StructuredData";
import { generateServiceOGImage } from "@/utils/ogImageGenerator";
import { generateSEOTitle, generateSEODescription, generateCanonicalURL } from "@/utils/seoUtils";
import { ServiceShareButtons } from "@/components/services/ServiceShareButtons";
import { SaveServiceButton } from "@/components/services/SaveServiceButton";
import ServiceDetailBanner from "@/components/banners/ServiceDetailBanner";
import { RelatedBlogPosts, MechanicOtherServices } from "@/components/seo/InternalLinkWidgets";

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
  // New design (Planflow) interactive state
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  // Scroll hint: show the thin scrollbar briefly on load, then hide it so it
  // doesn't visually nag. Re-shown on actual scroll via onScroll below.
  const [showScrollHint, setShowScrollHint] = useState(true);
  const scrollHintTimer = useRef<ReturnType<typeof setTimeout>>();

  const pingScrollHint = () => {
    setShowScrollHint(true);
    if (scrollHintTimer.current) clearTimeout(scrollHintTimer.current);
    scrollHintTimer.current = setTimeout(() => setShowScrollHint(false), 1500);
  };

  useEffect(() => {
    scrollHintTimer.current = setTimeout(() => setShowScrollHint(false), 2500);
    return () => {
      if (scrollHintTimer.current) clearTimeout(scrollHintTimer.current);
    };
  }, []);

  const scrollbarHintClass = showScrollHint
    ? "[scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300"
    : "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

  const { seoData } = useSEOData('service', service?.id.toString() || '');

  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
    if (id) fetchServiceBySlugOrId(id);
  }, [id]);

  // Track a service-page view (once per session per service) for analytics
  useEffect(() => {
    if (!service?.id) return;
    const key = `sv_${service.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("service_views").insert({
        service_id: service.id,
        viewer_id: user?.id || null,
        user_agent: navigator.userAgent,
      });
    })().catch(() => {});
  }, [service?.id]);

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

  // Group a Georgian mobile number for readability: 577611515 → 577 61 15 15
  // (keeps an optional +995 country code prefix; falls back to the raw value).
  const formatPhone = (raw: string | null) => {
    if (!raw) return raw || "";
    const digits = raw.replace(/\D/g, "");
    let cc = "";
    let local = digits;
    if (digits.length === 12 && digits.startsWith("995")) { cc = "+995 "; local = digits.slice(3); }
    else if (digits.length === 10 && digits.startsWith("0")) { local = digits.slice(1); }
    if (local.length === 9) {
      return `${cc}${local.slice(0, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7, 9)}`;
    }
    return raw;
  };

  // Masked + grouped teaser: 577611515 → +995 *** ** *5 15 (last 3 digits shown).
  const formatMaskedPhone = (raw: string | null) => {
    if (!raw) return "";
    const digits = raw.replace(/\D/g, "");
    let local = digits;
    if (digits.length === 12 && digits.startsWith("995")) local = digits.slice(3);
    else if (digits.length === 10 && digits.startsWith("0")) local = digits.slice(1);
    if (local.length !== 9) return maskPhoneNumber(raw);
    const visible = 3;
    const chars = local.split("").map((d, i) => (i < local.length - visible ? "*" : d)).join("");
    return `+995 ${chars.slice(0, 3)} ${chars.slice(3, 5)} ${chars.slice(5, 7)} ${chars.slice(7, 9)}`;
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

  const openPhone = () => {
    if (service) trackPhoneView(service.id);
    setPhoneOpen(true);
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
            <div role="alert" className="text-2xl font-bold text-gray-900">სერვისი ვერ მოიძებნა</div>
            <Button onClick={() => navigate("/services")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              სერვისებზე დაბრუნება
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // SEO metadata
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
    ...(service.category ? [{ name: service.category.name, url: `https://fixup.ge/category/${createCategorySlug(service.category.name)}` }] : []),
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

        {service.mechanic.phone && (
          <Button
            className="w-full"
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

        {isValidUUID(service.mechanic.id) ? (
          <Button
            variant="outline"
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
            price: service.price_from || undefined,
            priceCurrency: "GEL",
            availability: service.price_from ? "InStock" : "PreOrder",
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
          aggregateRating={service.rating && service.review_count ? {
            ratingValue: service.rating,
            reviewCount: service.review_count
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
            price: service.price_from || undefined,
            priceCurrency: "GEL",
            availability: service.price_from ? "InStock" : "PreOrder"
          }}
          aggregateRating={service.rating && service.review_count ? {
            ratingValue: service.rating,
            reviewCount: service.review_count
          } : undefined}
        />
        
        {/* FAQ Schema for common questions */}
        <FAQSchema faqs={serviceFAQs} />
        
        <BreadcrumbSchema items={breadcrumbItems} />

      {(() => {
        const photos = (service.photos && service.photos.length > 0) ? service.photos : [];
        const hasPhotos = photos.length > 0;
        const idx = Math.min(activeImg, Math.max(0, photos.length - 1));
        const priceDisplay = formatPrice(service.price_from, service.price_to);
        const mechName = `${service.mechanic.first_name} ${service.mechanic.last_name}`.trim();
        const initials = `${service.mechanic.first_name?.charAt(0) || ""}${service.mechanic.last_name?.charAt(0) || ""}`.toUpperCase();
        const locationText = [service.city, service.district].filter(Boolean).join(" · ") || "მდებარეობა შეთანხმებით";
        const paymentText = [service.accepts_cash_payment && "ნაღდი", service.accepts_card_payment && "ბარათი"].filter(Boolean).join(", ") || "ნაღდი";
        const carText = service.car_brands && service.car_brands.length > 0
          ? (service.car_brands.length >= 15 ? "ყველა ბრენდი" : service.car_brands.join(", "))
          : "ყველა ბრენდი";
        const hasProfile = isValidUUID(service.mechanic.id);
        const goProfile = () => navigate(`/mechanic/${createMechanicSlug(service.mechanic.display_id || 0, service.mechanic.first_name, service.mechanic.last_name)}`);
        const doCall = () => { window.location.href = `tel:${service.mechanic.phone}`; };

        return (
        <div className="font-sans bg-ink-50 text-ink-900 antialiased pb-[88px] lg:pb-0">

          {/* ═════════ HERO ═════════ */}
          <section className="relative bg-white overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 via-white to-accent-50/30" />
              <div className="absolute -top-32 -right-32 h-[440px] w-[440px] rounded-full bg-accent-500/8 blur-3xl" />
              <div className="absolute -bottom-40 -left-20 h-[420px] w-[420px] rounded-full bg-brand-500/8 blur-3xl" />
            </div>

            <div className="relative max-w-[1280px] mx-auto px-4 lg:px-8 pt-5 pb-7">
              {/* Breadcrumb */}
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-ink-500 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <a href="/" className="hover:text-ink-900 inline-flex items-center gap-1 shrink-0"><Home className="h-3 w-3" />მთავარი</a>
                <span className="text-ink-300 shrink-0">/</span>
                <a href="/services" className="hover:text-ink-900 shrink-0">სერვისები</a>
                {service.category && (<>
                  <span className="text-ink-300 shrink-0">/</span>
                  <a href={`/category/${createCategorySlug(service.category.name)}`} className="hover:text-ink-900 shrink-0">{service.category.name}</a>
                </>)}
                <span className="text-ink-300 shrink-0">/</span>
                <span aria-current="page" className="text-ink-900 font-semibold truncate">{service.name}</span>
              </nav>

              {/* Title — single line, horizontal scroll with right fade mask */}
              <div className="mt-5">
                <div
                  className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  style={{ maskImage: "linear-gradient(to right, black 0%, black 88%, transparent 100%)", WebkitMaskImage: "linear-gradient(to right, black 0%, black 88%, transparent 100%)" }}
                >
                  <h1 className="text-[22px] md:text-[30px] lg:text-[40px] font-bold tracking-[-0.02em] leading-[1.1] text-ink-900 whitespace-nowrap">
                    {seoData?.h1_title || service.name}<span className="text-accent-500">.</span>
                  </h1>
                </div>
                {seoData?.h2_description && (
                  <p className="mt-2 text-[14px] md:text-[15px] text-ink-500 leading-relaxed">{seoData.h2_description}</p>
                )}
                <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => navigate("/services")} className="h-8 px-3 rounded-pill bg-white/80 backdrop-blur border border-ink-200/60 hover:border-ink-300 text-ink-700 text-[11.5px] font-semibold inline-flex items-center gap-1.5"><ArrowLeft className="h-3.5 w-3.5" />უკან</button>
                    <SaveServiceButton serviceId={service.id} />
                    <ServiceShareButtons serviceName={service.name} serviceUrl={canonicalUrl} serviceDescription={service.description || undefined} />
                    <button type="button" onClick={() => setReportOpen(true)} className="h-8 w-8 rounded-pill bg-white/80 hover:bg-white backdrop-blur border border-ink-200/60 hover:border-ink-300 text-ink-500 grid place-items-center" aria-label="დააფიქსირე პრობლემა"><Flag className="h-3.5 w-3.5" /></button>
                  </div>
                  {/* Meta — single line, horizontal scroll with right fade mask */}
                  <div
                    className="flex items-center gap-x-4 text-[12.5px] text-ink-600 overflow-x-auto whitespace-nowrap lg:justify-end max-w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{ maskImage: "linear-gradient(to right, black 0%, black 90%, transparent 100%)", WebkitMaskImage: "linear-gradient(to right, black 0%, black 90%, transparent 100%)" }}
                  >
                    <span className="inline-flex items-center gap-1.5 shrink-0"><MapPin className="h-3.5 w-3.5 text-ink-400" />{locationText}{service.address ? ` · ${service.address}` : ""}</span>
                    <span className="text-ink-300 shrink-0">·</span>
                    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-ink-400 shrink-0">განცხადება #{service.id}</span>
                  </div>
                </div>
              </div>

              {/* Bento */}
              <div className="mt-5 grid grid-cols-12 gap-3">
                {/* Gallery */}
                <div className="col-span-12 lg:col-span-8">
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-ink-200/60 bg-ink-100 shadow-card group">
                    {hasPhotos ? (
                      <img src={photos[idx]} alt={service.name} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-ink-300"><Image className="h-14 w-14" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/30 via-transparent to-transparent pointer-events-none" />
                    {hasPhotos && (
                      <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-white/85 backdrop-blur border border-white/60 text-ink-900 text-[10.5px] font-mono tabular-nums font-semibold">
                        {String(idx + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
                      </div>
                    )}
                    {hasPhotos && (
                      <button type="button" onClick={() => setLightbox(true)} className="absolute top-3 right-3 h-8 px-3 rounded-pill bg-white/85 hover:bg-white backdrop-blur border border-white/60 text-ink-900 text-[11.5px] font-semibold inline-flex items-center gap-1.5"><Maximize2 className="h-3.5 w-3.5" />გადიდება</button>
                    )}
                    {photos.length > 1 && (<>
                      <button type="button" onClick={() => setActiveImg(i => (i - 1 + photos.length) % photos.length)} className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/85 hover:bg-white backdrop-blur border border-white/60 grid place-items-center text-ink-900 opacity-0 group-hover:opacity-100 transition shadow-pop"><ChevronLeft className="h-4 w-4" /></button>
                      <button type="button" onClick={() => setActiveImg(i => (i + 1) % photos.length)} className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/85 hover:bg-white backdrop-blur border border-white/60 grid place-items-center text-ink-900 opacity-0 group-hover:opacity-100 transition shadow-pop"><ChevronRight className="h-4 w-4" /></button>
                      <div className="absolute left-3 right-3 bottom-3 flex gap-1.5">
                        {photos.slice(0, 6).map((g, i) => (
                          <button key={i} type="button" onClick={() => setActiveImg(i)} className={`relative flex-1 h-12 rounded-lg overflow-hidden ring-2 transition ${i === idx ? "ring-accent-500" : "ring-white/70 hover:ring-white"}`}>
                            <img src={g} alt="" className="absolute inset-0 h-full w-full object-cover" />
                            {i !== idx && <span className="absolute inset-0 bg-ink-950/35" />}
                          </button>
                        ))}
                      </div>
                    </>)}
                  </div>
                </div>

                {/* Right stack */}
                <div className="col-span-12 lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-3">
                  {/* Price + provider */}
                  <div className="col-span-2 lg:col-span-1 rounded-2xl bg-white/85 backdrop-blur-xl border border-ink-200/60 shadow-card p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="text-[9.5px] uppercase tracking-[0.16em] font-bold text-ink-400">ფასი</div>
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-success-700"><span className="h-1.5 w-1.5 rounded-full bg-success-500" />აქტიური</span>
                    </div>
                    <div className="mt-1 text-[22px] font-bold tracking-tight text-ink-900 leading-tight">{priceDisplay || "შეთანხმებით"}</div>

                    <div className="mt-4 pt-4 border-t border-ink-100">
                      <div className="text-[9.5px] uppercase tracking-[0.16em] font-bold text-ink-400 mb-2">გამოაქვეყნა</div>
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl bg-brand-500 text-white grid place-items-center text-[13px] font-bold tracking-wider shrink-0">{initials || "?"}</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-bold text-ink-900 truncate">{mechName}</div>
                          {service.mechanic.phone && (
                            <button type="button" onClick={openPhone} className="mt-1.5 w-full group flex items-center justify-between gap-2 rounded-xl border border-accent-200 bg-accent-50/50 hover:bg-accent-50 px-3 py-2 transition">
                              <span className="text-[16px] font-bold font-mono tabular-nums tracking-tight text-ink-900">{formatMaskedPhone(service.mechanic.phone)}</span>
                              <span className="inline-flex items-center gap-1 px-2.5 h-7 rounded-pill bg-accent-500 text-white text-[11px] font-bold animate-phone-glow shrink-0">
                                <Eye className="h-3.5 w-3.5" />ჩვენება
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                      {service.mechanic.phone ? (
                        <button type="button" onClick={openPhone} className="mt-3 w-full h-11 rounded-btn bg-brand-500 hover:bg-brand-600 text-white text-[13px] font-bold inline-flex items-center justify-center gap-2"><Phone className="h-4 w-4" />დაურეკე ხელოსანს</button>
                      ) : (
                        <div className="mt-3 w-full h-11 rounded-btn bg-ink-100 text-ink-400 text-[12.5px] font-semibold inline-flex items-center justify-center">ნომერი მიუწვდომელია</div>
                      )}
                      {hasProfile ? (
                        <button type="button" onClick={goProfile} className="mt-2 w-full text-[11.5px] text-ink-600 hover:text-ink-900 underline underline-offset-2 decoration-ink-200">სრული პროფილი</button>
                      ) : null}
                    </div>
                  </div>

                  {/* Details chips */}
                  <div className="col-span-2 lg:col-span-1 rounded-2xl bg-white/85 backdrop-blur-xl border border-ink-200/60 shadow-card p-4">
                    <div className="text-[9.5px] uppercase tracking-[0.16em] font-bold text-ink-400 mb-3">სამუშაო დეტალები</div>
                    <dl className="space-y-2.5 text-[12.5px]">
                      <div className="flex items-start justify-between gap-3">
                        <dt className="inline-flex items-center gap-1.5 text-ink-500 shrink-0"><Clock className="h-3.5 w-3.5 text-ink-400" />დრო</dt>
                        <dd className="text-ink-900 font-semibold text-right">{service.estimated_hours ? `${service.estimated_hours} საათი` : "შეთანხმებით"}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-3 border-t border-ink-100 pt-2.5">
                        <dt className="inline-flex items-center gap-1.5 text-ink-500 shrink-0"><MapPin className="h-3.5 w-3.5 text-ink-400" />ლოკაცია</dt>
                        <dd className="text-ink-900 font-semibold text-right">{locationText}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-3 border-t border-ink-100 pt-2.5">
                        <dt className="inline-flex items-center gap-1.5 text-ink-500 shrink-0"><CreditCard className="h-3.5 w-3.5 text-ink-400" />გადახდა</dt>
                        <dd className="text-ink-900 font-semibold text-right">{paymentText}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-3 border-t border-ink-100 pt-2.5">
                        <dt className="inline-flex items-center gap-1.5 text-ink-500 shrink-0"><Car className="h-3.5 w-3.5 text-ink-400" />მანქანა</dt>
                        <dd className="text-ink-900 font-semibold text-right">{carText}</dd>
                      </div>
                      {service.on_site_service && (
                        <div className="flex items-start justify-between gap-3 border-t border-ink-100 pt-2.5">
                          <dt className="inline-flex items-center gap-1.5 text-ink-500 shrink-0"><CheckCircle className="h-3.5 w-3.5 text-ink-400" />ადგილზე</dt>
                          <dd className="text-success-700 font-semibold text-right">კი</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═════════ DESCRIPTION + ASIDE ═════════ */}
          <section className="bg-ink-50 border-t border-ink-200/60">
            <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8 grid grid-cols-12 gap-5">
              <div className="col-span-12 lg:col-span-8 space-y-5">
                {/* Description */}
                <div className="rounded-2xl bg-white border border-ink-200/60 p-6">
                  <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-ink-400">აღწერა</div>
                  <h2 className="mt-1 text-[20px] font-bold tracking-tight text-ink-900 mb-3">{service.name}</h2>
                  <p className="text-[14px] leading-[1.75] text-ink-700 whitespace-pre-wrap">
                    {service.description || "დეტალური აღწერა არ არის მითითებული."}
                  </p>
                </div>

                {/* Ad banner */}
                <ServiceDetailBanner />

                {/* Videos */}
                {service.videos && service.videos.length > 0 && (
                  <div className="rounded-2xl bg-white border border-ink-200/60 p-6">
                    <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-ink-400 mb-3 inline-flex items-center gap-1.5"><Video className="h-3.5 w-3.5" />ვიდეოები ({service.videos.length})</div>
                    <ServiceVideoGallery videos={service.videos} serviceName={service.name} />
                  </div>
                )}

                {/* Map */}
                {service.latitude && service.longitude && (
                  <div className="rounded-2xl bg-white border border-ink-200/60 overflow-hidden">
                    <div className="px-6 pt-5 pb-3 flex items-end justify-between gap-3 border-b border-ink-100">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-ink-400">ლოკაცია</div>
                        <h3 className="mt-1 text-[18px] font-bold tracking-tight text-ink-900">{locationText}{service.address ? `, ${service.address}` : ""}</h3>
                      </div>
                      <button type="button" onClick={handleGetDirections} className="h-9 px-3.5 rounded-pill bg-brand-500 hover:bg-brand-600 text-white text-[12px] font-semibold inline-flex items-center gap-1.5">მარშრუტი<ArrowRight className="h-3.5 w-3.5" /></button>
                    </div>
                    <LocationMapPicker
                      latitude={service.latitude}
                      longitude={service.longitude}
                      onLocationChange={handleLocationChange}
                      interactive={false}
                      className="h-[300px] md:h-[380px] w-full"
                    />
                  </div>
                )}

                {/* Reviews */}
                <ServiceReviews serviceId={service.id} onReviewAdded={handleReviewAdded} />
              </div>

              {/* Aside — provider */}
              <aside className="col-span-12 lg:col-span-4">
                <div className="lg:sticky lg:top-[88px] space-y-3">
                  <div className="rounded-2xl bg-white border border-ink-200/60 p-5">
                    <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-ink-400 mb-3">გამოაქვეყნა</div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-brand-500 text-white grid place-items-center text-[15px] font-bold tracking-wider shrink-0">{initials || "?"}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-bold text-ink-900 truncate">{mechName}</div>
                        <div className="text-[11.5px] text-ink-500">ხელოსანი{service.city ? ` · ${service.city}` : ""}</div>
                      </div>
                    </div>
                    {service.mechanic.rating ? (
                      <div className="mt-3 inline-flex items-center gap-1.5 text-[12.5px]">
                        <Star className="h-4 w-4 fill-accent-500 text-accent-500" />
                        <span className="font-bold text-ink-900">{service.mechanic.rating}</span>
                        <span className="text-ink-400">შეფასება</span>
                      </div>
                    ) : null}
                    {hasProfile ? (
                      <button type="button" onClick={goProfile} className="mt-4 w-full h-10 rounded-btn border border-ink-300 hover:border-ink-900 text-ink-900 text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5">სრული პროფილი<ArrowRight className="h-3.5 w-3.5" /></button>
                    ) : (
                      <div className="mt-4 w-full text-center text-[11.5px] text-ink-400 py-2">პროფილი მიუწვდომელია</div>
                    )}
                    {service.mechanic.phone && (
                      <button type="button" onClick={openPhone} className="mt-2 w-full h-11 rounded-btn bg-brand-500 hover:bg-brand-600 text-white text-[13px] font-bold inline-flex items-center justify-center gap-2"><Phone className="h-4 w-4" />დაურეკე ხელოსანს</button>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </section>

          {/* ═════════ RELATED + BLOG (existing widgets, real data) ═════════ */}
          <section className="bg-white border-t border-ink-200/60">
            <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8 space-y-10">
              {service.mechanic?.id && (
                <MechanicOtherServices mechanicId={service.mechanic.id} excludeServiceId={service.id} />
              )}
              <RelatedBlogPosts limit={3} />
            </div>
          </section>

          {/* ═════════ MOBILE STICKY ═════════ */}
          {service.mechanic?.phone && (
            <div className="lg:hidden fixed bottom-[70px] md:bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-xl border-t border-ink-200/60 px-3 py-2.5 flex items-center gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-brand-500 text-white grid place-items-center text-[11px] font-bold shrink-0">{initials || "?"}</div>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-ink-900 truncate">{mechName}</div>
                  <div className="text-[10px] text-ink-500 truncate">ფასი: {priceDisplay || "შეთანხმებით"}</div>
                </div>
              </div>
              <button type="button" onClick={openPhone} className="ml-auto h-10 px-4 rounded-pill bg-brand-500 text-white text-[12.5px] font-bold inline-flex items-center gap-1.5 shrink-0"><Phone className="h-3.5 w-3.5" />დარეკე</button>
            </div>
          )}

          {/* ═════════ LIGHTBOX ═════════ */}
          {lightbox && hasPhotos && (
            <div className="fixed inset-0 z-50 grid place-items-center p-4" onClick={() => setLightbox(false)}>
              <div className="absolute inset-0 bg-ink-950/85 backdrop-blur-sm" />
              <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => setLightbox(false)} className="absolute -top-12 right-0 h-10 px-3 rounded-pill bg-white text-ink-900 inline-flex items-center gap-2 text-[12px] font-semibold border border-ink-200"><X className="h-4 w-4" />დახურვა</button>
                <div className="rounded-2xl overflow-hidden bg-white border border-ink-200">
                  <img src={photos[idx]} alt={service.name} className="w-full max-h-[640px] object-contain bg-ink-50" />
                </div>
              </div>
            </div>
          )}

          {/* ═════════ PHONE REVEAL ═════════ */}
          {phoneOpen && service.mechanic.phone && (
            <div className="fixed inset-0 z-50 grid place-items-center p-4" onClick={() => setPhoneOpen(false)}>
              <div className="absolute inset-0 bg-ink-950/55 backdrop-blur-sm" />
              <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-float overflow-hidden border border-ink-200/60" onClick={(e) => e.stopPropagation()}>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-11 w-11 rounded-xl bg-brand-500 text-white grid place-items-center text-[14px] font-bold tracking-wider shrink-0">{initials || "?"}</div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold text-ink-900 truncate">{mechName}</div>
                      <div className="text-[11.5px] text-ink-500">ხელოსანი{service.city ? ` · ${service.city}` : ""}</div>
                    </div>
                    <button type="button" onClick={() => setPhoneOpen(false)} className="ml-auto h-8 w-8 rounded-btn hover:bg-ink-100 grid place-items-center"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-success-700 mb-1.5 inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-success-500" />გახსნილი ნომერი</div>
                  <a href={`tel:${service.mechanic.phone}`} className="block rounded-xl bg-ink-50 border border-ink-200/60 px-4 py-4 text-center hover:border-brand-500 transition">
                    <span className="block text-[28px] md:text-[32px] font-extrabold text-ink-900 font-mono tabular-nums tracking-tight leading-none">{formatPhone(service.mechanic.phone)}</span>
                  </a>
                  <button type="button" onClick={() => { navigator.clipboard?.writeText(service.mechanic.phone || ""); toast.success("ნომერი დაკოპირდა"); }} className="mt-2 w-full h-9 rounded-btn bg-white border border-ink-200 hover:border-ink-900 inline-flex items-center justify-center gap-1.5 text-ink-700 text-[12px] font-semibold"><Copy className="h-3.5 w-3.5" />ნომრის კოპირება</button>
                  <div className="mt-3 rounded-xl bg-accent-50 border border-accent-200 p-3 flex items-center gap-3">
                    <span className="h-9 w-9 rounded-lg bg-brand-500 grid place-items-center shrink-0"><Wrench className="h-4 w-4 text-white" /></span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9.5px] uppercase tracking-[0.18em] font-bold text-accent-700">დარეკვისას</div>
                      <div className="text-[13px] font-bold text-ink-900 leading-tight mt-0.5">ახსენე — <span className="tracking-tight">FIX<span className="text-accent-500">U</span>P</span>-დან გირეკავ</div>
                    </div>
                  </div>
                  <button type="button" onClick={doCall} className="mt-3 w-full h-11 rounded-pill bg-brand-500 hover:bg-brand-600 text-white text-[13px] font-bold inline-flex items-center justify-center gap-2"><Phone className="h-4 w-4" />დარეკვა ახლავე</button>
                  <p className="mt-2.5 text-[10.5px] text-ink-500 text-center">დარეკვის ღილაკი გაუშვებს სატელეფონო აპლიკაციას</p>
                </div>
              </div>
            </div>
          )}

          {/* ═════════ REPORT ═════════ */}
          {reportOpen && (
            <div className="fixed inset-0 z-50 grid place-items-center p-4" onClick={() => setReportOpen(false)}>
              <div className="absolute inset-0 bg-ink-950/55 backdrop-blur-sm" />
              <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-float p-5 border border-ink-200/60" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-8 w-8 rounded-lg bg-danger-50 text-danger-600 grid place-items-center"><Flag className="h-4 w-4" /></span>
                  <span className="text-[14px] font-bold text-ink-900">დააფიქსირე პრობლემა</span>
                  <button type="button" onClick={() => setReportOpen(false)} className="ml-auto h-8 w-8 rounded-btn hover:bg-ink-100 grid place-items-center"><X className="h-4 w-4" /></button>
                </div>
                <p className="text-[12px] text-ink-600 mb-3">თუ ცრუ ინფორმაცია ან მავნე ქცევა შენიშნე — გვითხარი.</p>
                <div className="space-y-1.5">
                  {["ცრუ ინფორმაცია", "არ პასუხობს", "დახურულია, მაგრამ აქტიური ჩანს", "სხვა"].map(r => (
                    <button key={r} type="button" onClick={() => { toast.success("მადლობა, მიღებულია"); setReportOpen(false); }} className="w-full px-3 py-2.5 rounded-xl border border-ink-200 hover:border-ink-900 text-left text-[12.5px] font-semibold text-ink-900">{r}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
        );
      })()}
    </Layout>
  );
};

export default ServiceDetail;
