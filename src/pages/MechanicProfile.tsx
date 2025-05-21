import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check, MapPin, Phone, Mail, Star, Clock, Wrench, FileCheck, Car } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";

type MechanicType = {
  id: string;
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    city: string;
    district: string;
    street: string;
    is_verified: boolean;
  };
  mechanic_profile: {
    description: string | null;
    specialization: string | null;
    experience_years: number | null;
    rating: number | null;
    review_count: number;
    is_mobile: boolean;
    accepts_card_payment: boolean;
    working_hours: any | null;
    verified_at: string | null;
  };
};

type ServiceType = {
  id: number;
  name: string;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  estimated_hours: number | null;
  category_id: number | null;
  service_categories: {
    name: string;
  } | null;
};

type CertificateType = {
  id: number;
  title: string;
  issuing_organization: string | null;
  issue_date: string | null;
  image_url: string | null;
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
  images: string[] | null;
};

const MechanicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("services");
  const [mechanic, setMechanic] = useState<MechanicType | null>(null);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [certificates, setCertificates] = useState<CertificateType[]>([]);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }
    
    const fetchMechanicData = async () => {
      setLoading(true);
      try {
        // Fetch mechanic profile data
        const { data: mechanicData, error: mechanicError } = await supabase
          .from("profiles")
          .select(`
            id,
            first_name, 
            last_name, 
            email, 
            phone, 
            city, 
            district, 
            street,
            is_verified,
            mechanic_profiles!inner(
              description, 
              specialization, 
              experience_years, 
              rating, 
              review_count, 
              is_mobile,
              accepts_card_payment,
              working_hours,
              verified_at
            )
          `)
          .eq("id", id)
          .eq("role", "mechanic")
          .single();
        
        if (mechanicError) throw mechanicError;

        // Format the data to match MechanicType
        const formattedMechanic: MechanicType = {
          id: mechanicData.id,
          profile: {
            first_name: mechanicData.first_name,
            last_name: mechanicData.last_name,
            email: mechanicData.email,
            phone: mechanicData.phone,
            city: mechanicData.city,
            district: mechanicData.district,
            street: mechanicData.street,
            is_verified: mechanicData.is_verified
          },
          mechanic_profile: mechanicData.mechanic_profiles
        };
        
        setMechanic(formattedMechanic);
        
        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from("mechanic_services")
          .select(`
            *,
            service_categories(name)
          `)
          .eq("mechanic_id", id)
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        
        if (servicesError) throw servicesError;
        setServices(servicesData || []);
        
        // Fetch certificates
        const { data: certificatesData, error: certificatesError } = await supabase
          .from("certificates")
          .select("*")
          .eq("mechanic_id", id)
          .order("issue_date", { ascending: false });
        
        if (certificatesError) throw certificatesError;
        setCertificates(certificatesData || []);
        
        // Fetch reviews with user data
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("reviews")
          .select(`
            id,
            rating,
            comment,
            created_at,
            images,
            user_id,
            profiles(first_name, last_name)
          `)
          .eq("mechanic_id", id)
          .order("created_at", { ascending: false });
        
        if (reviewsError) throw reviewsError;
        
        // Transform reviews data to match ReviewType
        const formattedReviews: ReviewType[] = (reviewsData || []).map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
          user: {
            first_name: review.profiles?.first_name || "Unknown",
            last_name: review.profiles?.last_name || "User"
          },
          // Handle JSON type for images by properly converting to string[]
          images: Array.isArray(review.images) 
            ? review.images.map(img => String(img))
            : null
        }));
        
        setReviews(formattedReviews);
      } catch (error) {
        console.error("Error fetching mechanic data:", error);
        toast.error("ხელოსნის მონაცემების ჩატვირთვისას შეცდომა დაფიქსირდა");
        navigate("/search");
      } finally {
        setLoading(false);
      }
    };
    
    fetchMechanicData();
  }, [id, navigate]);
  
  // Generate initials from name for avatar fallback
  const initials = mechanic
    ? `${mechanic.profile.first_name.charAt(0)}${mechanic.profile.last_name.charAt(0)}`
    : "";
    
  const handleBooking = (serviceId?: number) => {
    if (!user) {
      toast.error("ჯავშნის გასაკეთებლად გთხოვთ გაიაროთ ავტორიზაცია");
      navigate("/login");
      return;
    }
    
    // In a real app, this would navigate to booking page or open booking modal
    // For now, just show a toast
    toast.success(`დაჯავშნის პროცესი დაიწყო${serviceId ? ` სერვისისთვის #${serviceId}` : ''}!`);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-muted">
          <div className="bg-primary text-white py-12">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-8 w-64 mb-2" />
                  <Skeleton className="h-5 w-48 mb-4" />
                  <div className="flex gap-4 mb-4">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="order-2 lg:order-1 lg:col-span-1">
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <Skeleton className="h-6 w-48 mb-4" />
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-start">
                        <Skeleton className="h-5 w-5 mr-3" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-20 mb-1" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 lg:col-span-2">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 pt-6 border-b">
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="border-b border-gray-100 last:border-0 pb-5 last:pb-0">
                          <Skeleton className="h-6 w-48 mb-2" />
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!mechanic) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-muted flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <h1 className="text-2xl font-bold mb-4">ხელოსანი ვერ მოიძებნა</h1>
            <p className="mb-6">მოთხოვნილი ხელოსანი არ არსებობს ან წაშლილია.</p>
            <Button onClick={() => navigate("/search")}>
              დაბრუნება ძიებაზე
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero section with mechanic info */}
      <main className="flex-grow bg-muted">
        <div className="bg-primary text-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24 rounded-full border-4 border-white">
                <AvatarImage src="" />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xl">
                  {mechanic?.profile.first_name.charAt(0)}{mechanic?.profile.last_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {mechanic?.profile.first_name} {mechanic?.profile.last_name}
                  </h1>
                  {mechanic?.profile.is_verified && (
                    <Badge className="bg-green-500 text-white flex items-center">
                      <Check className="h-3 w-3 mr-1" /> დადასტურებული
                    </Badge>
                  )}
                </div>
                
                <p className="text-blue-100 mb-2">
                  {mechanic?.mechanic_profile.specialization || "ავტოხელოსანი"}
                </p>
                
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-semibold">
                      {mechanic?.mechanic_profile.rating?.toFixed(1) || "N/A"}
                    </span>
                    <span className="text-blue-100 ml-1">
                      ({mechanic?.mechanic_profile.review_count} შეფასება)
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-1 text-blue-200" />
                    <span>
                      {mechanic?.profile.city}
                      {mechanic?.profile.district ? `, ${mechanic?.profile.district}` : ""}
                    </span>
                  </div>
                  
                  {mechanic?.mechanic_profile.experience_years && (
                    <div className="flex items-center">
                      <Wrench className="h-5 w-5 mr-1 text-blue-200" />
                      <span>{mechanic.mechanic_profile.experience_years} წლიანი გამოცდილება</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {certificates.slice(0, 2).map((cert) => (
                    <Badge key={cert.id} variant="secondary" className="bg-blue-600 text-white">
                      <FileCheck className="h-3 w-3 mr-1" /> {cert.title}
                    </Badge>
                  ))}
                  {mechanic?.mechanic_profile.is_mobile && (
                    <Badge variant="secondary" className="bg-blue-600 text-white">
                      <Car className="h-3 w-3 mr-1" /> მობილური სერვისი
                    </Badge>
                  )}
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="bg-secondary hover:bg-secondary/90 text-white shrink-0"
                onClick={() => {
                  if (!user) {
                    toast.error("ჯავშნის გასაკეთებლად გთხოვთ გაიაროთ ავტორიზაცია");
                    navigate("/login");
                    return;
                  }
                  toast.success(`დაჯავშნის პროცესი დაიწყო!`);
                }}
              >
                <Calendar className="h-5 w-5 mr-2" /> დაჯავშნა
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left sidebar with contact info */}
            <div className="order-2 lg:order-1 lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">საკონტაქტო ინფორმაცია</h3>
                
                <div className="space-y-4">
                  {mechanic?.profile.street && (
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium">მისამართი</p>
                        <p className="text-muted-foreground">
                          {mechanic.profile.street}, {mechanic.profile.city}
                          {mechanic.profile.district ? `, ${mechanic.profile.district}` : ""}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {mechanic?.profile.phone && (
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 text-muted-foreground shrink-0 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium">ტელეფონი</p>
                        <p className="text-muted-foreground">
                          <a href={`tel:${mechanic.profile.phone}`} className="hover:text-primary">
                            {mechanic.profile.phone}
                          </a>
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-muted-foreground shrink-0 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium">ელ-ფოსტა</p>
                      <p className="text-muted-foreground">
                        <a href={`mailto:${mechanic?.profile.email}`} className="hover:text-primary">
                          {mechanic?.profile.email}
                        </a>
                      </p>
                    </div>
                  </div>
                  
                  {mechanic?.mechanic_profile.working_hours && (
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-muted-foreground shrink-0 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium">სამუშაო საათები</p>
                        <p className="text-muted-foreground">
                          {typeof mechanic.mechanic_profile.working_hours === 'string' 
                            ? mechanic.mechanic_profile.working_hours
                            : "ორშ-პარ: 10:00 - 18:00"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {mechanic?.mechanic_profile.specialization && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">სპეციალიზაცია</h3>
                  <div className="flex flex-wrap gap-2">
                    {mechanic.mechanic_profile.specialization.split(',').map((spec, i) => (
                      <Badge key={i} variant="outline" className="bg-muted">
                        <Car className="h-3 w-3 mr-1" /> {spec.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Main content area with tabs */}
            <div className="order-1 lg:order-2 lg:col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <Tabs defaultValue="services" onValueChange={setActiveTab}>
                  <div className="px-6 pt-6 border-b">
                    <TabsList className="grid grid-cols-3">
                      <TabsTrigger value="services">სერვისები</TabsTrigger>
                      <TabsTrigger value="about">შესახებ</TabsTrigger>
                      <TabsTrigger value="reviews">შეფასებები</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="services" className="p-6">
                    {services.length > 0 ? (
                      <div className="space-y-6">
                        {services.map((service) => (
                          <div key={service.id} className="border-b border-gray-100 last:border-0 pb-5 last:pb-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-lg font-medium">{service.name}</h4>
                                {service.service_categories && (
                                  <p className="text-sm text-muted-foreground">
                                    {service.service_categories.name}
                                  </p>
                                )}
                                {service.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {service.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-6 mt-2 text-muted-foreground text-sm">
                                  {service.estimated_hours && (
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 mr-1" />
                                      <span>
                                        {service.estimated_hours > 1 
                                          ? `${service.estimated_hours} საათი` 
                                          : `${service.estimated_hours} საათი`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold">
                                  {service.price_from && service.price_to
                                    ? `${service.price_from} - ${service.price_to} ₾`
                                    : service.price_from
                                      ? `${service.price_from} ₾`
                                      : "ფასი შეთანხმებით"}
                                </p>
                                <Button 
                                  size="sm" 
                                  className="mt-2 bg-secondary hover:bg-secondary/90"
                                  onClick={() => {
                                    if (!user) {
                                      toast.error("ჯავშნის გასაკეთებლად გთხოვთ გაიაროთ ავტორიზაცია");
                                      navigate("/login");
                                      return;
                                    }
                                    toast.success(`დაჯავშნის პროცესი დაიწყო სერვისისთვის #${service.id}!`);
                                  }}
                                >
                                  დაჯავშნა
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          ამ ხელოსანს ჯერ არ აქვს დამატებული სერვისები
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="about" className="p-6">
                    <h3 className="text-lg font-semibold mb-4">ჩემს შესახებ</h3>
                    <p className="text-muted-foreground mb-6">
                      {mechanic?.mechanic_profile.description || "ინფორმაცია არ არის მითითებული"}
                    </p>
                    
                    {certificates.length > 0 && (
                      <>
                        <h3 className="text-lg font-semibold mb-4">სერტიფიკატები</h3>
                        <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-2">
                          {certificates.map((cert) => (
                            <li key={cert.id}>
                              {cert.title}
                              {cert.issuing_organization && ` - ${cert.issuing_organization}`}
                              {cert.issue_date && ` (${format(new Date(cert.issue_date), "yyyy")})`}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="reviews" className="p-6">
                    <div className="flex items-center mb-8">
                      <div className="bg-primary/10 rounded-xl p-4 text-center mr-6">
                        <p className="text-3xl font-bold text-primary">
                          {mechanic?.mechanic_profile.rating?.toFixed(1) || "N/A"}
                        </p>
                        <div className="flex justify-center my-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < Math.floor(mechanic?.mechanic_profile.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {mechanic?.mechanic_profile.review_count} შეფასებიდან
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-1">მომხმარებლების შეფასებები</h3>
                        <p className="text-muted-foreground">მომხმარებლების გამოცდილების საფუძველზე</p>
                      </div>
                    </div>
                    
                    {reviews.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium">
                                {review.user?.first_name} {review.user?.last_name}
                              </p>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-muted-foreground text-sm mb-3">
                              {format(new Date(review.created_at), "dd/MM/yyyy")}
                            </p>
                            <p>{review.comment || "შეფასება კომენტარის გარეშე"}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">ამ ხელოსანს ჯერ არ აქვს შეფასებები</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MechanicProfile;
