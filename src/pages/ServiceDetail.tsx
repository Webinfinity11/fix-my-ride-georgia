import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
  ArrowLeft
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
  const [service, setService] = useState<ServiceType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

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

      // Fetch mechanic profile
      const { data: mechanicData, error: mechanicError } = await supabase
        .from("profiles")
        .select(`
          id,
          first_name,
          last_name,
          city,
          district,
          mechanic_profiles(rating, review_count, specialization, experience_years, is_mobile)
        `)
        .eq("id", serviceData.mechanic_id)
        .single();

      if (mechanicError) throw mechanicError;

      const transformedService: ServiceType = {
        id: serviceData.id,
        name: serviceData.name,
        description: serviceData.description,
        price_from: serviceData.price_from,
        price_to: serviceData.price_to,
        estimated_hours: serviceData.estimated_hours,
        city: serviceData.city,
        district: serviceData.district,
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
          rating: mechanicData.mechanic_profiles?.rating || null,
          review_count: mechanicData.mechanic_profiles?.review_count || null,
          specialization: mechanicData.mechanic_profiles?.specialization || null,
          experience_years: mechanicData.mechanic_profiles?.experience_years || null,
          is_mobile: mechanicData.mechanic_profiles?.is_mobile || false
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
    if (priceFrom && priceTo) return `${priceFrom} - ${priceTo} GEL`;
    if (priceFrom) return `${priceFrom} GEL დან`;
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-muted py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-6">
              <Skeleton className="h-8 w-1/3" />
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-64 w-full rounded-lg" />
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-muted py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-2xl font-bold mb-4">სერვისი ვერ მოიძებნა</h1>
              <Link to="/services-detail">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  ყველა სერვისის დათვალიერება
                </Button>
              </Link>
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
            {/* Breadcrumb */}
            <div className="mb-6">
              <Link 
                to="/services-detail" 
                className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                ყველა სერვისის დათვალიერება
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Service Header */}
                <Card className="border-primary/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl mb-2">{service.name}</CardTitle>
                        {service.category && (
                          <Badge variant="secondary" className="mb-3">
                            {service.category.name}
                          </Badge>
                        )}
                      </div>
                      {service.rating && (
                        <div className="flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-2">
                          <div className="flex items-center">
                            {renderStars(Math.round(service.rating))}
                          </div>
                          <span className="font-semibold">{service.rating}</span>
                          <span className="text-muted-foreground text-sm">
                            ({service.review_count} შეფასება)
                          </span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {service.description && (
                      <p className="text-muted-foreground leading-relaxed">
                        {service.description}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Photos */}
                {service.photos && service.photos.length > 0 && (
                  <Card className="border-primary/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        ფოტოები
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Main Photo */}
                        {selectedPhoto && (
                          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                            <img
                              src={selectedPhoto}
                              alt={service.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Photo Thumbnails */}
                        {service.photos.length > 1 && (
                          <div className="grid grid-cols-4 gap-2">
                            {service.photos.map((photo, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedPhoto(photo)}
                                className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                                  selectedPhoto === photo ? 'border-primary' : 'border-muted'
                                }`}
                              >
                                <img
                                  src={photo}
                                  alt={`${service.name} ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Service Details */}
                <Card className="border-primary/10">
                  <CardHeader>
                    <CardTitle>სერვისის დეტალები</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Price */}
                    <div className="bg-primary/5 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">ფასი:</span>
                        <span className="text-2xl font-bold text-primary">
                          {formatPrice(service.price_from, service.price_to)}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {/* Service Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {service.estimated_hours && (
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">სავარაუდო დრო</p>
                            <p className="text-muted-foreground">{service.estimated_hours} საათი</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">ლოკაცია</p>
                          <p className="text-muted-foreground">
                            {service.city}{service.district ? `, ${service.district}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">სამუშაო დღეები</p>
                          <p className="text-muted-foreground">
                            {formatWorkingDays(service.working_days)}
                          </p>
                        </div>
                      </div>

                      {service.working_hours_start && service.working_hours_end && (
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">სამუშაო საათები</p>
                            <p className="text-muted-foreground">
                              {service.working_hours_start} - {service.working_hours_end}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Payment Methods */}
                    <div>
                      <h4 className="font-medium mb-3">გადახდის მეთოდები</h4>
                      <div className="flex gap-4">
                        {service.accepts_cash_payment && (
                          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg">
                            <Banknote className="h-4 w-4" />
                            <span>ნაღდი ფული</span>
                          </div>
                        )}
                        {service.accepts_card_payment && (
                          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
                            <CreditCard className="h-4 w-4" />
                            <span>ბანკის ბარათი</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Services */}
                    <div>
                      <h4 className="font-medium mb-3">დამატებითი მომსახურება</h4>
                      <div className="flex items-center gap-2">
                        {service.on_site_service ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>ადგილზე მისვლის მომსახურება</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <XCircle className="h-4 w-4" />
                            <span>ადგილზე მისვლის მომსახურება არ არის</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Car Brands */}
                    {service.car_brands && service.car_brands.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">მანქანის მარკები</h4>
                        <div className="flex flex-wrap gap-2">
                          {service.car_brands.map(brand => (
                            <Badge key={brand} variant="outline" className="bg-muted/50">
                              {brand}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Mechanic Info & Actions */}
              <div className="space-y-6">
                {/* Mechanic Info */}
                <Card className="border-primary/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      ხელოსანი
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-semibold text-lg">
                        {service.mechanic.first_name} {service.mechanic.last_name}
                      </h3>
                      {service.mechanic.specialization && (
                        <p className="text-muted-foreground">{service.mechanic.specialization}</p>
                      )}
                    </div>

                    {service.mechanic.rating && (
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center">
                          {renderStars(Math.round(service.mechanic.rating))}
                        </div>
                        <span className="font-medium">{service.mechanic.rating}</span>
                        <span className="text-muted-foreground text-sm">
                          ({service.mechanic.review_count})
                        </span>
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{service.mechanic.city}{service.mechanic.district ? `, ${service.mechanic.district}` : ''}</span>
                      </div>
                      
                      {service.mechanic.experience_years && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-muted-foreground" />
                          <span>{service.mechanic.experience_years} წლის გამოცდილება</span>
                        </div>
                      )}

                      {service.mechanic.is_mobile && (
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span>მობილური სერვისი</span>
                        </div>
                      )}
                    </div>

                    <Link to={`/mechanic/${service.mechanic.id}`}>
                      <Button variant="outline" className="w-full">
                        ხელოსნის პროფილი
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <Card className="border-primary/10">
                  <CardContent className="p-6 space-y-4">
                    <Link to={`/book?service=${service.id}`}>
                      <Button className="w-full bg-primary hover:bg-primary-dark" size="lg">
                        დაჯავშნა
                      </Button>
                    </Link>
                    
                    <Button variant="outline" className="w-full" size="lg">
                      <Phone className="h-4 w-4 mr-2" />
                      დაკავშირება
                    </Button>
                  </CardContent>
                </Card>

                {/* Additional Info */}
                {service.category?.description && (
                  <Card className="border-primary/10">
                    <CardHeader>
                      <CardTitle className="text-base">კატეგორიის შესახებ</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {service.category.description}
                      </p>
                    </CardContent>
                  </Card>
                )}
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
