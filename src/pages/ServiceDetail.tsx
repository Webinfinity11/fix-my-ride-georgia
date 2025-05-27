import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Star, 
  MapPin, 
  Clock, 
  CreditCard, 
  Banknote, 
  Car, 
  User, 
  Phone, 
  Calendar,
  CheckCircle,
  XCircle,
  Camera,
  ArrowLeft,
  Share2,
  Heart,
  MessageCircle,
  Shield,
  Zap,
  Award,
  ThumbsUp,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SendMessageButton } from "@/components/mechanic/SendMessageButton";
import LocationMapPicker from "@/components/forms/LocationMapPicker";

type ServiceType = {
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
  working_days: string[] | null;
  working_hours_start: string | null;
  working_hours_end: string | null;
  photos: string[] | null;
  rating: number | null;
  review_count: number | null;
  category: {
    id: number;
    name: string;
    description: string | null;
  } | null;
  mechanic: {
    id: string;
    first_name: string;
    last_name: string;
    city: string;
    district: string;
    phone: string | null;
    rating: number | null;
    review_count: number | null;
    specialization: string | null;
    experience_years: number | null;
    is_mobile: boolean;
  };
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

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<ServiceType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (id) {
      fetchService();
    }
  }, [id]);

  const fetchService = async () => {
    try {
      console.log("Fetching service with ID:", id);
      
      const serviceId = parseInt(id as string);
      if (isNaN(serviceId)) {
        toast.error("არასწორი სერვისის ID");
        return;
      }
      
      const { data: serviceData, error: serviceError } = await supabase
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
          working_days,
          working_hours_start,
          working_hours_end,
          photos,
          rating,
          review_count,
          category_id,
          mechanic_id
        `)
        .eq("id", serviceId)
        .eq("is_active", true)
        .single();

      if (serviceError) throw serviceError;

      if (!serviceData) {
        toast.error("სერვისი ვერ მოიძებნა");
        return;
      }

      // Fetch category
      let categoryData = null;
      if (serviceData.category_id) {
        const { data: catData, error: catError } = await supabase
          .from("service_categories")
          .select("id, name, description")
          .eq("id", serviceData.category_id)
          .single();
        
        if (!catError && catData) {
          categoryData = catData;
        }
      }

      // Fetch mechanic profile with phone
      const { data: mechanicData, error: mechanicError } = await supabase
        .from("profiles")
        .select(`
          id,
          first_name,
          last_name,
          city,
          district,
          phone,
          mechanic_profiles(rating, review_count, specialization, experience_years, is_mobile)
        `)
        .eq("id", serviceData.mechanic_id)
        .single();

      if (mechanicError) throw mechanicError;

      const mechanicProfile = Array.isArray(mechanicData.mechanic_profiles) 
        ? mechanicData.mechanic_profiles[0] 
        : mechanicData.mechanic_profiles;

      const transformedService: ServiceType = {
        id: serviceData.id,
        name: serviceData.name,
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
        on_site_service: serviceData.on_site_service,
        accepts_card_payment: serviceData.accepts_card_payment,
        accepts_cash_payment: serviceData.accepts_cash_payment,
        working_days: serviceData.working_days,
        working_hours_start: serviceData.working_hours_start,
        working_hours_end: serviceData.working_hours_end,
        photos: serviceData.photos,
        rating: serviceData.rating,
        review_count: serviceData.review_count,
        category: categoryData,
        mechanic: {
          id: mechanicData.id,
          first_name: mechanicData.first_name,
          last_name: mechanicData.last_name,
          city: mechanicData.city,
          district: mechanicData.district,
          phone: mechanicData.phone,
          rating: mechanicProfile?.rating || null,
          review_count: mechanicProfile?.review_count || null,
          specialization: mechanicProfile?.specialization || null,
          experience_years: mechanicProfile?.experience_years || null,
          is_mobile: mechanicProfile?.is_mobile || false
        }
      };

      setService(transformedService);
      if (transformedService.photos && transformedService.photos.length > 0) {
        setSelectedPhoto(transformedService.photos[0]);
      }
    } catch (error: any) {
      console.error("Error fetching service:", error);
      toast.error("სერვისის ჩატვირთვისას შეცდომა დაფიქსირდა");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceFrom: number | null, priceTo: number | null) => {
    if (!priceFrom && !priceTo) return "ფასი შეთანხმებით";
    if (priceFrom && priceTo) return `${priceFrom} - ${priceTo} ₾`;
    if (priceFrom) return `${priceFrom} ₾ დან`;
    return "ფასი შეთანხმებით";
  };

  const formatWorkingDays = (days: string[] | null) => {
    if (!days || days.length === 0) return "არ არის მითითებული";
    if (days.length === 7) return "ყოველდღე";
    return days.map(day => weekDaysMap[day] || day).join(", ");
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

  const handlePhoneCall = (phoneNumber: string) => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      toast.error("ტელეფონის ნომერი არ არის მითითებული");
    }
  };

  const nextPhoto = () => {
    if (service?.photos && service.photos.length > 1) {
      const nextIndex = (currentPhotoIndex + 1) % service.photos.length;
      setCurrentPhotoIndex(nextIndex);
      setSelectedPhoto(service.photos[nextIndex]);
    }
  };

  const prevPhoto = () => {
    if (service?.photos && service.photos.length > 1) {
      const prevIndex = currentPhotoIndex === 0 ? service.photos.length - 1 : currentPhotoIndex - 1;
      setCurrentPhotoIndex(prevIndex);
      setSelectedPhoto(service.photos[prevIndex]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Header />
        <main className="py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <Skeleton className="h-8 w-48 mb-8" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Skeleton className="h-96 w-full rounded-2xl" />
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
                <div className="space-y-6">
                  <Skeleton className="h-64 w-full rounded-2xl" />
                  <Skeleton className="h-48 w-full rounded-2xl" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Header />
        <main className="flex-grow flex items-center justify-center py-20">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-8 bg-gray-100 rounded-full flex items-center justify-center">
              <Car className="h-12 w-12 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold mb-4 text-gray-900">სერვისი ვერ მოიძებნა</h1>
            <p className="text-gray-600 mb-8">შეიძლება სერვისი წაშლილი იყოს ან არ არსებობდეს</p>
            <Button onClick={() => navigate("/services-detail")} className="bg-primary hover:bg-primary/90">
              <ArrowLeft className="h-4 w-4 mr-2" />
              ყველა სერვისის დათვალიერება
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />
      
      <main className="py-4 lg:py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate("/services-detail")}
                className="hover:bg-white/50 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                ყველა სერვისი
              </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
              {/* Main Content */}
              <div className="xl:col-span-2 space-y-6 lg:space-y-8">
                {/* Hero Photo Section */}
                <div className="relative group">
                  <Card className="border-0 shadow-xl lg:shadow-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50">
                    <div className="relative">
                      {service.photos && service.photos.length > 0 ? (
                        <>
                          <div className="aspect-video relative overflow-hidden rounded-t-2xl">
                            <img
                              src={selectedPhoto || service.photos[0]}
                              alt={service.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            
                            {/* Photo Navigation */}
                            {service.photos.length > 1 && (
                              <>
                                <button
                                  onClick={prevPhoto}
                                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
                                >
                                  <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={nextPhoto}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
                                >
                                  <ChevronRight className="h-5 w-5" />
                                </button>
                                
                                {/* Photo Indicators */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                  {service.photos.map((_, index) => (
                                    <button
                                      key={index}
                                      onClick={() => {
                                        setCurrentPhotoIndex(index);
                                        setSelectedPhoto(service.photos![index]);
                                      }}
                                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                        index === currentPhotoIndex 
                                          ? 'bg-white scale-125' 
                                          : 'bg-white/50 hover:bg-white/75'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/20 rounded-t-2xl flex items-center justify-center">
                          <div className="text-center">
                            <Camera className="h-16 w-16 text-primary/40 mx-auto mb-4" />
                            <p className="text-primary/60 text-lg">ფოტო არ არის</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Floating Action Buttons */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setIsLiked(!isLiked)}
                          className="bg-white/90 backdrop-blur-sm hover:bg-white border-0 shadow-lg"
                        >
                          <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-white/90 backdrop-blur-sm hover:bg-white border-0 shadow-lg"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Service Header */}
                    <CardContent className="p-6 lg:p-8">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 break-words">{service.name}</h1>
                            {service.category && (
                              <Badge className="bg-gradient-to-r from-primary to-blue-600 text-white px-3 py-1 w-fit">
                                {service.category.name}
                              </Badge>
                            )}
                          </div>
                          
                          {service.rating && (
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                              <div className="flex items-center gap-1">
                                {renderStars(Math.round(service.rating))}
                              </div>
                              <span className="text-lg font-semibold text-gray-900">{service.rating}</span>
                              <span className="text-gray-500">({service.review_count} შეფასება)</span>
                            </div>
                          )}
                        </div>

                        <div className="text-left lg:text-right flex-shrink-0">
                          <div className="text-2xl lg:text-3xl font-bold text-primary mb-2">
                            {formatPrice(service.price_from, service.price_to)}
                          </div>
                          {service.estimated_hours && (
                            <div className="flex items-center justify-start lg:justify-end text-gray-500 text-sm">
                              <Clock className="h-4 w-4 mr-1" />
                              {service.estimated_hours} საათი
                            </div>
                          )}
                        </div>
                      </div>

                      {service.description && (
                        <div className="mt-6">
                          <p className="text-gray-700 text-base lg:text-lg leading-relaxed break-words">{service.description}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Service Features */}
                <Card className="border-0 shadow-lg lg:shadow-xl bg-white/70 backdrop-blur-sm">
                  <CardContent className="p-6 lg:p-8">
                    <h2 className="text-xl lg:text-2xl font-bold mb-6 flex items-center gap-2">
                      <Zap className="h-6 w-6 text-primary" />
                      სერვისის თავისებურებები
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                        <MapPin className="h-6 lg:h-8 w-6 lg:w-8 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-blue-900 text-sm lg:text-base">მდებარეობა</p>
                          <p className="text-blue-700 text-sm break-words">
                            {service.city}{service.district ? `, ${service.district}` : ''}
                          </p>
                        </div>
                      </div>

                      {service.on_site_service && (
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                          <Car className="h-6 lg:h-8 w-6 lg:w-8 text-green-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-green-900 text-sm lg:text-base">მისვლით</p>
                            <p className="text-green-700 text-sm">ადგილზე მისვლა</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                        <Calendar className="h-6 lg:h-8 w-6 lg:w-8 text-purple-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-purple-900 text-sm lg:text-base">სამუშაო დღეები</p>
                          <p className="text-purple-700 text-xs lg:text-sm break-words">
                            {formatWorkingDays(service.working_days)}
                          </p>
                        </div>
                      </div>

                      {service.working_hours_start && service.working_hours_end && (
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl">
                          <Clock className="h-6 lg:h-8 w-6 lg:w-8 text-orange-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-orange-900 text-sm lg:text-base">სამუშაო საათები</p>
                            <p className="text-orange-700 text-sm">
                              {service.working_hours_start} - {service.working_hours_end}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl">
                        <Shield className="h-6 lg:h-8 w-6 lg:w-8 text-teal-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-teal-900 text-sm lg:text-base">გადახდა</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {service.accepts_cash_payment && (
                              <Badge variant="outline" className="text-xs border-teal-300 text-teal-700">
                                ნაღდი
                              </Badge>
                            )}
                            {service.accepts_card_payment && (
                              <Badge variant="outline" className="text-xs border-teal-300 text-teal-700">
                                ბარათი
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location Map Section */}
                {(service.latitude && service.longitude) && (
                  <Card className="border-0 shadow-lg lg:shadow-xl bg-white/70 backdrop-blur-sm">
                    <CardContent className="p-6 lg:p-8">
                      <h2 className="text-xl lg:text-2xl font-bold mb-6 flex items-center gap-2">
                        <MapPin className="h-6 w-6 text-primary" />
                        მდებარეობა რუკაზე
                      </h2>
                      
                      {service.address && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                          <p className="text-blue-900 font-medium">
                            {service.address}
                          </p>
                          <p className="text-blue-700 text-sm">
                            {service.city}{service.district ? `, ${service.district}` : ''}
                          </p>
                        </div>
                      )}
                      
                      <LocationMapPicker
                        latitude={service.latitude}
                        longitude={service.longitude}
                        onLocationChange={() => {}} // მხოლოდ ჩვენებისთვის, ცვლილება არ სჭირდება
                        interactive={false}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Car Brands */}
                {service.car_brands && service.car_brands.length > 0 && (
                  <Card className="border-0 shadow-lg lg:shadow-xl bg-white/70 backdrop-blur-sm">
                    <CardContent className="p-6 lg:p-8">
                      <h2 className="text-xl lg:text-2xl font-bold mb-6 flex items-center gap-2">
                        <Car className="h-6 w-6 text-primary" />
                        მანქანის მარკები
                      </h2>
                      <div className="flex flex-wrap gap-2 lg:gap-3">
                        {service.car_brands.map(brand => (
                          <Badge 
                            key={brand} 
                            variant="secondary" 
                            className="px-3 lg:px-4 py-1 lg:py-2 text-sm bg-gradient-to-r from-gray-100 to-gray-200 hover:from-primary hover:to-blue-600 hover:text-white transition-all duration-200"
                          >
                            {brand}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
                {/* Mechanic Card */}
                <Card className="border-0 shadow-xl lg:shadow-2xl bg-gradient-to-br from-white to-blue-50">
                  <CardContent className="p-6 lg:p-8">
                    <div className="text-center mb-6">
                      <Avatar className="w-16 lg:w-20 h-16 lg:h-20 mx-auto mb-4 ring-4 ring-primary/20">
                        <AvatarImage src={`https://avatar.vercel.sh/${service.mechanic.id}.png`} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white text-lg lg:text-xl">
                          {service.mechanic.first_name[0]}{service.mechanic.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-1 break-words">
                        {service.mechanic.first_name} {service.mechanic.last_name}
                      </h3>
                      
                      {service.mechanic.specialization && (
                        <p className="text-gray-600 mb-3 text-sm lg:text-base break-words">{service.mechanic.specialization}</p>
                      )}

                      {service.mechanic.rating && (
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <div className="flex items-center">
                            {renderStars(Math.round(service.mechanic.rating))}
                          </div>
                          <span className="font-semibold">{service.mechanic.rating}</span>
                          <span className="text-gray-500 text-sm">({service.mechanic.review_count})</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex items-center gap-3 text-gray-600">
                        <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm lg:text-base break-words">
                          {service.mechanic.city}{service.mechanic.district ? `, ${service.mechanic.district}` : ''}
                        </span>
                      </div>
                      
                      {service.mechanic.experience_years && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <Award className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="text-sm lg:text-base">{service.mechanic.experience_years} წლის გამოცდილება</span>
                        </div>
                      )}

                      {service.mechanic.is_mobile && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <Car className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="text-sm lg:text-base">მობილური სერვისი</span>
                        </div>
                      )}

                      {service.mechanic.phone && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="text-sm lg:text-base break-all">{service.mechanic.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Link to={`/book?service=${service.id}`} className="w-full block">
                        <Button className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-lg hover:shadow-xl transition-all duration-200" size="lg">
                          <Calendar className="h-5 w-5 mr-2" />
                          დაჯავშნა
                        </Button>
                      </Link>
                      
                      <SendMessageButton 
                        mechanicId={service.mechanic.id}
                        mechanicName={`${service.mechanic.first_name} ${service.mechanic.last_name}`}
                        variant="outline"
                        size="lg"
                        className="w-full border-2 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700"
                      />

                      <Button 
                        onClick={() => handlePhoneCall(service.mechanic.phone || '')}
                        variant="ghost" 
                        className="w-full hover:bg-green-50 hover:text-green-700 transition-all duration-200" 
                        size="lg"
                        disabled={!service.mechanic.phone}
                      >
                        <Phone className="h-5 w-5 mr-2" />
                        {service.mechanic.phone ? 'დარეკვა' : 'ნომერი არ არის'}
                      </Button>

                      <Link to={`/mechanic/${service.mechanic.id}`} className="w-full block">
                        <Button variant="ghost" className="w-full hover:bg-primary/10 hover:text-primary" size="lg">
                          <User className="h-5 w-5 mr-2" />
                          ხელოსნის პროფილი
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Info */}
                {service.category?.description && (
                  <Card className="border-0 shadow-lg lg:shadow-xl bg-gradient-to-br from-white to-amber-50">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <ThumbsUp className="h-5 w-5 text-amber-600" />
                        კატეგორიის შესახებ
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm lg:text-base break-words">{service.category.description}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Stats Card */}
                <Card className="border-0 shadow-lg lg:shadow-xl bg-gradient-to-br from-white to-green-50">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Eye className="h-5 w-5 text-green-600" />
                      სტატისტიკა
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm lg:text-base">ნახვები:</span>
                        <span className="font-semibold">1,234</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm lg:text-base">ჯავშნები:</span>
                        <span className="font-semibold">89</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm lg:text-base">წარმატებული:</span>
                        <span className="font-semibold text-green-600">95%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ServiceDetail;
