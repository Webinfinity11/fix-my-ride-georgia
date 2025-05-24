
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Clock, CreditCard, Banknote, Car, User, Phone, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ServiceDetailType = {
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
  latitude: number | null;
  longitude: number | null;
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
    description: string | null;
    specialization: string | null;
    experience_years: number | null;
    rating: number | null;
    review_count: number | null;
    is_mobile: boolean;
    phone: string | null;
    avatar_url: string | null;
    verified_at: string | null;
  };
};

type ReviewType = {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
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
  const [service, setService] = useState<ServiceDetailType | null>(null);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchService();
      fetchReviews();
    }
  }, [id]);

  const fetchService = async () => {
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
          working_days,
          working_hours_start,
          working_hours_end,
          photos,
          rating,
          review_count,
          latitude,
          longitude,
          service_categories(id, name),
          profiles!mechanic_services_mechanic_id_fkey(
            id,
            first_name,
            last_name,
            city,
            district,
            phone,
            avatar_url,
            mechanic_profiles(
              description,
              specialization,
              experience_years,
              rating,
              review_count,
              is_mobile,
              verified_at
            )
          )
        `)
        .eq("id", parseInt(id))
        .eq("is_active", true)
        .single();

      if (error) throw error;

      if (data && data.profiles) {
        const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
        
        setService({
          id: data.id,
          name: data.name,
          description: data.description,
          price_from: data.price_from,
          price_to: data.price_to,
          estimated_hours: data.estimated_hours,
          city: data.city,
          district: data.district,
          car_brands: data.car_brands,
          on_site_service: data.on_site_service,
          accepts_card_payment: data.accepts_card_payment,
          accepts_cash_payment: data.accepts_cash_payment,
          working_days: data.working_days,
          working_hours_start: data.working_hours_start,
          working_hours_end: data.working_hours_end,
          photos: data.photos,
          rating: data.rating,
          review_count: data.review_count,
          latitude: data.latitude,
          longitude: data.longitude,
          category: data.service_categories,
          mechanic: {
            id: profile?.id || "",
            first_name: profile?.first_name || "",
            last_name: profile?.last_name || "",
            city: profile?.city || "",
            district: profile?.district || "",
            phone: profile?.phone || null,
            avatar_url: profile?.avatar_url || null,
            description: profile?.mechanic_profiles?.description || null,
            specialization: profile?.mechanic_profiles?.specialization || null,
            experience_years: profile?.mechanic_profiles?.experience_years || null,
            rating: profile?.mechanic_profiles?.rating || null,
            review_count: profile?.mechanic_profiles?.review_count || null,
            is_mobile: profile?.mechanic_profiles?.is_mobile || false,
            verified_at: profile?.mechanic_profiles?.verified_at || null
          }
        });
      }
    } catch (error: any) {
      console.error("Error fetching service:", error);
      toast.error("სერვისის ჩატვირთვისას შეცდომა დაფიქსირდა");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("service_reviews")
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id
        `)
        .eq("service_id", parseInt(id!))
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = data.map(review => review.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", userIds);

        if (profilesError) throw profilesError;

        const transformedReviews = data?.map(review => {
          const userProfile = profiles?.find(p => p.id === review.user_id);
          return {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            created_at: review.created_at,
            user: {
              first_name: userProfile?.first_name || "",
              last_name: userProfile?.last_name || ""
            }
          };
        }) || [];

        setReviews(transformedReviews);
      }
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const formatPrice = (priceFrom: number | null, priceTo: number | null) => {
    if (!priceFrom && !priceTo) return "ფასი შეთანხმებით";
    if (priceFrom && priceTo) return `${priceFrom} - ${priceTo} ₾`;
    if (priceFrom) return `${priceFrom} ₾-დან`;
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
            <div className="max-w-6xl mx-auto">
              <Skeleton className="h-8 w-1/2 mb-6" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <Card>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-1/2 mb-4" />
                      <Skeleton className="h-10 w-full" />
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
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-muted py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">სერვისი ვერ მოიძებნა</h1>
            <Link to="/service-search">
              <Button>სერვისების ძიება</Button>
            </Link>
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
            {/* Header with title and rating */}
            <div className="flex flex-col sm:flex-row justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">{service.name}</h1>
                {service.category && (
                  <Badge variant="secondary" className="mb-3">{service.category.name}</Badge>
                )}
              </div>
              {service.rating && (
                <div className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center gap-1">
                    {renderStars(Math.round(service.rating))}
                  </div>
                  <span className="font-semibold">{service.rating}</span>
                  <span className="text-sm text-muted-foreground">({service.review_count} შეფასება)</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Service Photos */}
                {service.photos && service.photos.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">ფოტოები</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {service.photos.map((photo, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                            <img 
                              src={photo} 
                              alt={`სერვისის ფოტო ${index + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Service Description */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">სერვისის აღწერა</h3>
                    {service.description ? (
                      <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                    ) : (
                      <p className="text-muted-foreground italic">აღწერა არ არის მითითებული</p>
                    )}
                  </CardContent>
                </Card>

                {/* Service Details */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">სერვისის დეტალები</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span className="font-medium">ფასი:</span>
                          <span className="text-lg font-bold text-primary">{formatPrice(service.price_from, service.price_to)}</span>
                        </div>
                        {service.estimated_hours && (
                          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <span className="font-medium">სავარაუდო დრო:</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {service.estimated_hours} საათი
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span className="font-medium">ლოკაცია:</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {service.city}{service.district ? `, ${service.district}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <span className="font-medium block mb-2">გადახდის მეთოდები:</span>
                          <div className="space-y-1">
                            {service.accepts_cash_payment && (
                              <div className="flex items-center gap-2">
                                <Banknote className="h-4 w-4 text-green-600" />
                                <span className="text-sm">ნაღდი ანგარიშსწორება</span>
                              </div>
                            )}
                            {service.accepts_card_payment && (
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-blue-600" />
                                <span className="text-sm">ბარათით გადახდა</span>
                              </div>
                            )}
                            {service.on_site_service && (
                              <Badge variant="outline" className="mt-2">ადგილზე მისვლის სერვისი</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Working Schedule */}
                {service.working_days && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">სამუშაო გრაფიკი</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <span className="font-medium block mb-1">სამუშაო დღეები:</span>
                          <p>{formatWorkingDays(service.working_days)}</p>
                        </div>
                        {service.working_hours_start && service.working_hours_end && (
                          <div className="p-3 bg-muted rounded-lg">
                            <span className="font-medium block mb-1">სამუშაო საათები:</span>
                            <p>{service.working_hours_start} - {service.working_hours_end}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Car Brands */}
                {service.car_brands && service.car_brands.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        მანქანის მარკები
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {service.car_brands.map(brand => (
                          <Badge key={brand} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {brand}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reviews Section */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4">შეფასებები და კომენტარები</h3>
                    {reviewsLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="p-4 border rounded-lg">
                            <Skeleton className="h-4 w-1/4 mb-2" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        ))}
                      </div>
                    ) : reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.map(review => (
                          <div key={review.id} className="p-4 border rounded-lg bg-white">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                {renderStars(review.rating)}
                              </div>
                              <span className="font-medium">{review.user.first_name} {review.user.last_name}</span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString('ka-GE')}
                              </span>
                            </div>
                            {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>ჯერ არ არის შეფასებები ამ სერვისზე</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Mechanic Info Card */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      ხელოსანი
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          {service.mechanic.avatar_url ? (
                            <img 
                              src={service.mechanic.avatar_url} 
                              alt="ხელოსნის ფოტო"
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <Link 
                            to={`/mechanic/${service.mechanic.id}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {service.mechanic.first_name} {service.mechanic.last_name}
                          </Link>
                          {service.mechanic.verified_at && (
                            <div className="flex items-center gap-1 mt-1">
                              <Shield className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-green-600">დადასტურებული</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {service.mechanic.rating && (
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          <div className="flex items-center gap-1">
                            {renderStars(Math.round(service.mechanic.rating))}
                          </div>
                          <span className="text-sm font-medium">{service.mechanic.rating}</span>
                          <span className="text-xs text-muted-foreground">({service.mechanic.review_count} შეფასება)</span>
                        </div>
                      )}

                      {service.mechanic.specialization && (
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <span className="text-sm font-medium text-blue-800">{service.mechanic.specialization}</span>
                        </div>
                      )}

                      {service.mechanic.experience_years && (
                        <div className="text-sm text-muted-foreground">
                          გამოცდილება: <span className="font-medium">{service.mechanic.experience_years} წელი</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{service.mechanic.city}{service.mechanic.district ? `, ${service.mechanic.district}` : ''}</span>
                      </div>

                      {service.mechanic.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          <span>{service.mechanic.phone}</span>
                        </div>
                      )}

                      {service.mechanic.is_mobile && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          მობილური სერვისი
                        </Badge>
                      )}
                    </div>

                    <Link to={`/mechanic/${service.mechanic.id}`}>
                      <Button variant="outline" className="w-full mt-4">
                        ხელოსნის პროფილი
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Booking Card */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">დაჯავშნა</h3>
                    <div className="space-y-4 mb-6">
                      <div className="text-center p-4 bg-primary/5 rounded-lg">
                        <span className="text-2xl font-bold text-primary">
                          {formatPrice(service.price_from, service.price_to)}
                        </span>
                      </div>
                      {service.estimated_hours && (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>სავარაუდო დრო: {service.estimated_hours} საათი</span>
                        </div>
                      )}
                    </div>
                    <Link to={`/book?service=${service.id}`}>
                      <Button className="w-full bg-primary hover:bg-primary/90">
                        დაჯავშნა
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Contact Card */}
                {service.mechanic.phone && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">კონტაქტი</h3>
                      <a 
                        href={`tel:${service.mechanic.phone}`}
                        className="flex items-center justify-center gap-2 w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        დარეკვა
                      </a>
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
