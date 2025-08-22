import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check, MapPin, Phone, Mail, Star, Clock, Wrench, FileCheck, Car, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
// Fixed: removed useChat dependency
import MechanicReviews from "@/components/reviews/MechanicReviews";
import { extractMechanicDisplayId, createMechanicSlug } from "@/utils/slugUtils";
import SEOHead from "@/components/seo/SEOHead";
import { generateStructuredData, generateSEOTitle, generateSEODescription, generateCanonicalURL } from "@/utils/seoUtils";

type MechanicType = {
  id: string;
  display_id?: number;
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

// Add the booking prop to the component props
interface MechanicProfileProps {
  booking?: boolean;
}

const MechanicProfile = ({ booking = false }: MechanicProfileProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("services");
  const [mechanic, setMechanic] = useState<MechanicType | null>(null);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [certificates, setCertificates] = useState<CertificateType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // If the component is in booking mode, update the active tab to services
  useEffect(() => {
    if (booking) {
      setActiveTab("services");
    }
  }, [booking]);
  
  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }
    
    const fetchMechanicData = async () => {
      setLoading(true);
      try {
        // Extract the actual mechanic display ID from the URL parameter
        const mechanicDisplayId = extractMechanicDisplayId(id);
        
        // Fetch mechanic profile data (only public fields for verified mechanics)
        let mechanicQuery;
        const isNumeric = /^\d+$/.test(mechanicDisplayId);
        
        if (isNumeric) {
          // Query by display_id
          mechanicQuery = supabase
            .from("profiles")
            .select(`
              id,
              first_name, 
              last_name, 
              phone,
              city, 
              district, 
              avatar_url,
              is_verified,
              mechanic_profiles!inner(
                display_id,
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
            .eq("role", "mechanic")
            .eq("mechanic_profiles.display_id", parseInt(mechanicDisplayId))
            .single();
        } else {
          // Legacy UUID lookup
          mechanicQuery = supabase
            .from("profiles")
            .select(`
              id,
              first_name, 
              last_name, 
              phone,
              city, 
              district, 
              avatar_url,
              is_verified,
              mechanic_profiles!inner(
                display_id,
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
            .eq("id", mechanicDisplayId)
            .eq("role", "mechanic")
            .single();
        }
        
        const { data: mechanicData, error: mechanicError } = await mechanicQuery;
        
        // Update the URL to use the new display_id-slug format if we have the mechanic data
        if (!mechanicError && mechanicData && mechanicData.mechanic_profiles?.display_id) {
          const correctSlug = createMechanicSlug(mechanicData.mechanic_profiles.display_id, mechanicData.first_name, mechanicData.last_name);
          if (correctSlug !== id) {
            window.history.replaceState(null, '', `/mechanic/${correctSlug}`);
          }
        }
        
        if (mechanicError) throw mechanicError;

        // Format the data to match MechanicType (now with phone available for verified mechanics)
        const formattedMechanic: MechanicType = {
          id: mechanicData.id,
          display_id: mechanicData.mechanic_profiles?.display_id,
          profile: {
            first_name: mechanicData.first_name,
            last_name: mechanicData.last_name,
            email: '', // Not available publicly for security
            phone: mechanicData.phone || '', // Now available for verified mechanics
            city: mechanicData.city,
            district: mechanicData.district,
            street: '', // Not available publicly for security
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
          .eq("mechanic_id", mechanicData.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        
        if (servicesError) throw servicesError;
        setServices(servicesData || []);
        
        // Fetch certificates
        const { data: certificatesData, error: certificatesError } = await supabase
          .from("certificates")
          .select("*")
          .eq("mechanic_id", mechanicData.id)
          .order("issue_date", { ascending: false });
        
        if (certificatesError) throw certificatesError;
        setCertificates(certificatesData || []);
        
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
  
  const handleStartChat = async () => {
    if (!user) {
      toast.error("ჩატისთვის საჭიროა ავტორიზაცია");
      navigate("/login");
      return;
    }

    if (!id) return;

    try {
      // Check for existing direct chat
      const { data: existingChats, error: chatError } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          chat_participants!inner(user_id)
        `)
        .eq('type', 'direct');

      let existingChatId = null;

      if (existingChats) {
        // Find a direct chat where both users are participants
        for (const chat of existingChats) {
          const participantIds = chat.chat_participants.map((p: any) => p.user_id);
          if (participantIds.includes(user.id) && participantIds.includes(id) && participantIds.length === 2) {
            existingChatId = chat.id;
            break;
          }
        }
      }

      if (!existingChatId) {
        // Create new direct chat
        const { data: newRoom, error: createError } = await supabase
          .from('chat_rooms')
          .insert({
            type: 'direct',
            is_public: false,
            created_by: user.id
          })
          .select()
          .single();

        if (createError || !newRoom) {
          console.error('Error creating room:', createError);
          toast.error('ჩატის შექმნისას შეცდომა დაფიქსირდა');
          return;
        }

        // Add participants
        const { error: participantsError } = await supabase
          .from('chat_participants')
          .insert([
            { room_id: newRoom.id, user_id: user.id },
            { room_id: newRoom.id, user_id: id }
          ]);

        if (participantsError) {
          console.error('Error adding participants:', participantsError);
          toast.error('მონაწილეების დამატებისას შეცდომა დაფიქსირდა');
          return;
        }

        existingChatId = newRoom.id;
      }
      
      // Navigate to chat page with the room ID as a query parameter
      navigate(`/chat?room=${existingChatId}`);
      toast.success(`${mechanic?.profile.first_name}-თან ჩატი გაიხსნა`);
      
    } catch (error) {
      console.error('Error creating direct chat:', error);
      toast.error("ჩატის გახსნისას შეცდომა დაფიქსირდა");
    }
  };

  const handleReviewAdded = () => {
    // Refresh mechanic data to update rating
    if (id) {
      const fetchUpdatedMechanic = async () => {
        const mechanicDisplayId = extractMechanicDisplayId(id);
        
        const isNumeric = /^\d+$/.test(mechanicDisplayId);
        
        let mechanicQuery;
        if (isNumeric) {
          mechanicQuery = supabase
            .from("profiles")
            .select(`
              id,
              first_name, 
              last_name, 
              phone,
              city, 
              district, 
              avatar_url,
              is_verified,
              mechanic_profiles!inner(
                display_id,
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
            .eq("role", "mechanic")
            .eq("mechanic_profiles.display_id", parseInt(mechanicDisplayId))
            .single();
        } else {
          mechanicQuery = supabase
            .from("profiles")
            .select(`
              id,
              first_name, 
              last_name, 
              phone,
              city, 
              district, 
              avatar_url,
              is_verified,
              mechanic_profiles!inner(
                display_id,
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
            .eq("id", mechanicDisplayId)
            .eq("role", "mechanic")
            .single();
        }
        
        const { data: mechanicData, error } = await mechanicQuery;
        
        if (!error && mechanicData) {
          const formattedMechanic: MechanicType = {
            id: mechanicData.id,
            display_id: mechanicData.mechanic_profiles?.display_id,
            profile: {
              first_name: mechanicData.first_name,
              last_name: mechanicData.last_name,
              email: '', // Not available publicly for security
              phone: mechanicData.phone || '', // Now available for verified mechanics
              city: mechanicData.city,
              district: mechanicData.district,
              street: '', // Not available publicly for security
              is_verified: mechanicData.is_verified
            },
            mechanic_profile: mechanicData.mechanic_profiles
          };
          setMechanic(formattedMechanic);
        }
      };
      fetchUpdatedMechanic();
    }
  };

  if (loading) {
  // Generate SEO data
  const seoData = mechanic ? {
    first_name: mechanic.profile.first_name,
    last_name: mechanic.profile.last_name,
    city: mechanic.profile.city,
    rating: mechanic.mechanic_profile.rating,
    review_count: mechanic.mechanic_profile.review_count,
    specialization: mechanic.mechanic_profile.specialization,
    display_id: mechanic.display_id,
    slug: createMechanicSlug(mechanic.display_id || 0, mechanic.profile.first_name, mechanic.profile.last_name)
  } : null;

  const structuredData = seoData ? generateStructuredData('Person', {
    name: `${seoData.first_name} ${seoData.last_name}`,
    jobTitle: 'ავტომექანიკოსი',
    address: {
      '@type': 'PostalAddress',
      addressLocality: seoData.city,
      addressCountry: 'GE'
    },
    aggregateRating: seoData.rating ? {
      '@type': 'AggregateRating',
      ratingValue: seoData.rating,
      reviewCount: seoData.review_count || 0,
      bestRating: 5,
      worstRating: 1
    } : undefined
  }) : null;

  return (
    <div className="min-h-screen flex flex-col">
      {seoData && (
        <SEOHead
          title={generateSEOTitle('mechanic', seoData)}
          description={generateSEODescription('mechanic', seoData)}
          keywords={`${seoData.first_name} ${seoData.last_name}, ავტომექანიკოსი, ${seoData.city}, ${seoData.specialization || 'ავტოსერვისი'}`}
          canonical={generateCanonicalURL('mechanic', seoData)}
          structuredData={structuredData}
          type="profile"
        />
      )}
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
                <AvatarImage src="" alt={`${mechanic?.profile.first_name || ''} ${mechanic?.profile.last_name || ''}`.trim() || 'Mechanic profile'} />
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
              
              <div className="flex gap-3">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="bg-white text-primary hover:bg-gray-100"
                  onClick={handleStartChat}
                >
                  <MessageCircle className="h-5 w-5 mr-2" /> მიწერა
                </Button>
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
                <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
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
                    {id && (
                      <MechanicReviews 
                        mechanicId={mechanic?.id || ''} 
                        onReviewAdded={handleReviewAdded}
                      />
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
