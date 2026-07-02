import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check, MapPin, Phone, Mail, Star, Clock, Wrench, FileCheck, Car, MessageCircle, Briefcase, Home, ArrowLeft, ArrowRight, Share2, Flag, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
// Fixed: removed useChat dependency
import MechanicReviews from "@/components/reviews/MechanicReviews";
import { extractMechanicDisplayId, createMechanicSlug, createSlug } from "@/utils/slugUtils";
import { PhoneRevealDialog } from "@/components/services/PhoneRevealDialog";
import { RelatedBlogPosts } from "@/components/seo/InternalLinkWidgets";
import { trackMechanicPhone } from "@/utils/tracking";
import SEOHead from "@/components/seo/SEOHead";
import { PersonSchema, LocalBusinessSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { generateSEOTitle, generateSEODescription, generateCanonicalURL } from "@/utils/seoUtils";
import { isMechanicIndexable } from "@/utils/seoQuality";
import { generateMechanicOGImage } from "@/utils/ogImageGenerator";

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

type VacancyType = {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  is_active: boolean | null;
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
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [mechanic, setMechanic] = useState<MechanicType | null>(null);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [certificates, setCertificates] = useState<CertificateType[]>([]);
  const [vacancies, setVacancies] = useState<VacancyType[]>([]);
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

        // Fetch vacancies (only active ones for public view)
        const { data: vacanciesData, error: vacanciesError } = await supabase
          .from("mechanic_vacancies")
          .select("*")
          .eq("mechanic_id", mechanicData.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (vacanciesError) throw vacanciesError;
        setVacancies(vacanciesData || []);

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

  // Track a profile view (once per session, excluding the mechanic's own visits)
  useEffect(() => {
    if (!mechanic?.id) return;
    const key = `mpv_${mechanic.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id === mechanic.id) return; // don't count self-views
      await supabase.from("mechanic_profile_views").insert({
        mechanic_id: mechanic.id,
        viewer_id: user?.id || null,
        user_agent: navigator.userAgent,
      });
    })().catch(() => {});
  }, [mechanic?.id]);

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
            <div role="alert" className="text-2xl font-bold mb-4">ხელოსანი ვერ მოიძებნა</div>
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
  
  // SEO data
  const pageTitle = generateSEOTitle('mechanic', {
    name: `${mechanic.profile.first_name} ${mechanic.profile.last_name}`,
    city: mechanic.profile.city,
    rating: mechanic.mechanic_profile.rating,
    specialization: mechanic.mechanic_profile.specialization
  });

  const pageDescription = generateSEODescription('mechanic', {
    name: `${mechanic.profile.first_name} ${mechanic.profile.last_name}`,
    city: mechanic.profile.city,
    rating: mechanic.mechanic_profile.rating,
    review_count: mechanic.mechanic_profile.review_count,
    specialization: mechanic.mechanic_profile.specialization,
    experience_years: mechanic.mechanic_profile.experience_years
  });

  const canonicalUrl = generateCanonicalURL('mechanic', {
    display_id: mechanic.display_id,
    first_name: mechanic.profile.first_name,
    last_name: mechanic.profile.last_name
  });

  // Thin profiles (name only — no city, no description, no active service)
  // render noindex,follow. Keep in sync with the mechanic quality filter in
  // scripts/generate-sitemap.mjs.
  const mechanicIndexable = isMechanicIndexable({
    display_id: mechanic.display_id,
    first_name: mechanic.profile.first_name,
    city: mechanic.profile.city,
    description: mechanic.mechanic_profile.description,
    hasActiveService: services.length > 0,
  });

  // Breadcrumb items
  const breadcrumbItems = [
    { name: 'მთავარი', url: 'https://fixup.ge/' },
    { name: 'ხელოსნები', url: 'https://fixup.ge/mechanic' },
    { name: `${mechanic.profile.first_name} ${mechanic.profile.last_name}`, url: canonicalUrl }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        keywords={`${mechanic.profile.first_name} ${mechanic.profile.last_name}, ავტოხელოსანი, მექანიკოსი, ${mechanic.profile.city}, ${mechanic.mechanic_profile.specialization || 'ავტოსერვისი'}`}
        image={generateMechanicOGImage({
          first_name: mechanic.profile.first_name,
          last_name: mechanic.profile.last_name,
          city: mechanic.profile.city,
          rating: mechanic.mechanic_profile.rating || undefined,
          review_count: mechanic.mechanic_profile.review_count,
          specialization: mechanic.mechanic_profile.specialization || undefined,
          is_verified: mechanic.profile.is_verified
        })}
        url={canonicalUrl}
        canonical={canonicalUrl}
        type="profile"
        noindex={!mechanicIndexable}
      />

      {/* Person Schema for mechanic */}
      <PersonSchema
        name={`${mechanic.profile.first_name} ${mechanic.profile.last_name}`}
        jobTitle={mechanic.mechanic_profile.specialization || "ავტოხელოსანი"}
        url={canonicalUrl}
        telephone={mechanic.profile.phone}
        address={{
          addressLocality: mechanic.profile.city,
          addressRegion: mechanic.profile.district,
          addressCountry: "GE"
        }}
        aggregateRating={mechanic.mechanic_profile.rating ? {
          ratingValue: mechanic.mechanic_profile.rating,
          reviewCount: mechanic.mechanic_profile.review_count
        } : undefined}
      />

      {/* LocalBusiness Schema if mechanic has physical location */}
      {mechanic.profile.street && (
        <LocalBusinessSchema
          name={`${mechanic.profile.first_name} ${mechanic.profile.last_name} - ავტოსერვისი`}
          address={{
            streetAddress: mechanic.profile.street,
            addressLocality: mechanic.profile.city,
            addressRegion: mechanic.profile.district,
            addressCountry: "GE"
          }}
          telephone={mechanic.profile.phone}
          url={canonicalUrl}
          priceRange="$$"
          rating={mechanic.mechanic_profile.rating ? {
            ratingValue: mechanic.mechanic_profile.rating,
            reviewCount: mechanic.mechanic_profile.review_count
          } : undefined}
          openingHours={
            mechanic.mechanic_profile.working_hours 
              ? [typeof mechanic.mechanic_profile.working_hours === 'string' 
                  ? mechanic.mechanic_profile.working_hours 
                  : "Mo-Fr 09:00-18:00"]
              : ["Mo-Fr 09:00-18:00"]
          }
        />
      )}

      <BreadcrumbSchema items={breadcrumbItems} />

      <Header />
      
      {(() => {
        const m = mechanic;
        const fullName = `${m.profile.first_name} ${m.profile.last_name}`.trim();
        const initials = `${m.profile.first_name?.charAt(0) || ""}${m.profile.last_name?.charAt(0) || ""}`.toUpperCase();
        const phone = m.profile.phone || "";
        const hasPhone = !!phone;
        const typeLabel = m.mechanic_profile.specialization || "ავტოხელოსანი";
        const location = [m.profile.city, m.profile.district].filter(Boolean).join(" · ");
        const serviceUrl = (s: ServiceType) => `/service/${s.id}-${createSlug(s.name)}`;
        const openPhone = () => { if (hasPhone) { trackMechanicPhone(m.id); setPhoneOpen(true); } };
        const maskedPhone = (() => {
          const d = phone.replace(/\D/g, "");
          const local = d.length === 12 && d.startsWith("995") ? d.slice(3) : d;
          if (local.length !== 9) return phone;
          const c = local.split("").map((x, i) => (i < 6 ? "•" : x)).join("");
          return `+995 ${c.slice(0, 3)} ${c.slice(3, 5)} ${c.slice(5, 7)} ${c.slice(7, 9)}`;
        })();
        const doShare = async () => {
          try {
            if (navigator.share) await navigator.share({ title: fullName, url: canonicalUrl });
            else { await navigator.clipboard?.writeText(canonicalUrl); toast.success("ბმული დაკოპირდა"); }
          } catch { /* cancelled */ }
        };
        const tabs = [
          { k: "services", l: "სერვისები", n: services.length },
          { k: "reviews", l: "შეფასებები", n: m.mechanic_profile.review_count || 0 },
          ...(vacancies.length > 0 ? [{ k: "vacancies", l: "ვაკანსიები", n: vacancies.length }] : []),
        ];

        return (
        <main className="font-sans bg-ink-50 text-ink-900 antialiased pb-[88px] lg:pb-0">

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
                <a href="/mechanic" className="hover:text-ink-900 shrink-0">ხელოსნები</a>
                <span className="text-ink-300 shrink-0">/</span>
                <span aria-current="page" className="text-ink-900 font-semibold truncate">{fullName}</span>
              </nav>

              {/* Profile bento */}
              <div className="mt-5 grid grid-cols-12 gap-3">
                {/* LEFT — identity + actions */}
                <div className="col-span-12 lg:col-span-8">
                  <div className="rounded-2xl bg-white border border-ink-200/60 shadow-card p-5 md:p-7">
                    <div className="flex items-start gap-4 md:gap-5 flex-wrap">
                      <div className="relative shrink-0">
                        <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-brand-500 text-white grid place-items-center shadow-card relative overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,255,255,0.18),transparent_60%)]" />
                          <span className="relative text-[28px] md:text-[34px] font-bold tracking-[0.04em]">{initials || "?"}</span>
                        </div>
                        {m.profile.is_verified && <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success-500 border-[3px] border-white" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-pill bg-ink-50 border border-ink-200 text-ink-700 text-[10.5px] font-bold uppercase tracking-[0.14em] mb-2">
                          <Wrench className="h-3 w-3 text-ink-400" />{typeLabel}
                        </div>
                        <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ maskImage: "linear-gradient(to right, black 0%, black 90%, transparent 100%)", WebkitMaskImage: "linear-gradient(to right, black 0%, black 90%, transparent 100%)" }}>
                          <h1 className="text-[24px] md:text-[34px] lg:text-[44px] font-bold tracking-[-0.02em] leading-[1.05] text-ink-900 whitespace-nowrap">
                            {fullName}<span className="text-accent-500">.</span>
                          </h1>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-[12px] text-ink-500 flex-wrap">
                          {m.mechanic_profile.rating ? (
                            <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" /><span className="font-bold text-ink-900">{m.mechanic_profile.rating.toFixed(1)}</span></span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-success-500" />აქტიური პროფილი</span>
                          )}
                          {location && (<><span className="text-ink-300">·</span><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-ink-400" />{location}</span></>)}
                          <span className="text-ink-300">·</span>
                          <span className="font-mono tabular-nums">{services.length} სერვისი</span>
                          {m.display_id && (<><span className="text-ink-300">·</span><span className="font-mono tabular-nums">#{m.display_id}</span></>)}
                        </div>
                      </div>
                    </div>

                    {/* Action row */}
                    <div className="mt-5 pt-5 border-t border-ink-100 flex items-center gap-2 flex-wrap">
                      {hasPhone && (
                        <button type="button" onClick={openPhone} className="h-11 px-5 rounded-pill bg-brand-500 hover:bg-brand-600 text-white text-[13px] font-bold inline-flex items-center gap-2"><Phone className="h-4 w-4" />დაურეკე ხელოსანს</button>
                      )}
                      <button type="button" onClick={() => navigate("/mechanic")} className="h-11 w-11 rounded-pill bg-white border border-ink-200/60 hover:border-ink-300 text-ink-700 grid place-items-center" aria-label="უკან"><ArrowLeft className="h-4 w-4" /></button>
                      <button type="button" onClick={handleStartChat} className="h-11 px-3.5 rounded-pill bg-white border border-ink-200/60 hover:border-ink-300 text-ink-700 text-[12.5px] font-semibold inline-flex items-center gap-1.5"><MessageCircle className="h-4 w-4" />მიწერა</button>
                      <button type="button" onClick={doShare} className="h-11 px-3.5 rounded-pill bg-white border border-ink-200/60 hover:border-ink-300 text-ink-700 text-[12.5px] font-semibold inline-flex items-center gap-1.5"><Share2 className="h-4 w-4" />გაზიარება</button>
                      <button type="button" onClick={() => setReportOpen(true)} className="ml-auto h-11 w-11 rounded-pill bg-white border border-ink-200/60 hover:border-ink-300 text-ink-500 grid place-items-center" aria-label="დააფიქსირე პრობლემა"><Flag className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>

                {/* RIGHT — phone + summary */}
                <aside className="col-span-12 lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-3">
                  <div className="col-span-2 lg:col-span-1 rounded-2xl bg-white/85 backdrop-blur-xl border border-ink-200/60 shadow-card p-5">
                    <div className="flex items-baseline justify-between gap-3 mb-2">
                      <div className="text-[9.5px] uppercase tracking-[0.16em] font-bold text-ink-400">სატელეფონო კონტაქტი</div>
                      {hasPhone && <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-success-700"><span className="h-1.5 w-1.5 rounded-full bg-success-500" />ხელმისაწვდომი</span>}
                    </div>
                    {hasPhone ? (
                      <>
                        <button type="button" onClick={openPhone} className="w-full inline-flex items-center gap-2.5 text-left group">
                          <span className="text-[16px] font-bold text-ink-900 font-mono tabular-nums tracking-tight flex-1 truncate">{maskedPhone}</span>
                          <span className="inline-flex items-center gap-1 px-2 h-7 rounded-pill bg-accent-500 text-white transition text-[11px] font-bold animate-phone-glow shrink-0"><Eye className="h-3.5 w-3.5" />ჩვენება</span>
                        </button>
                        <button type="button" onClick={openPhone} className="mt-3 w-full h-11 rounded-btn bg-brand-500 hover:bg-brand-600 text-white text-[13px] font-bold inline-flex items-center justify-center gap-2"><Phone className="h-4 w-4" />დაურეკე ხელოსანს</button>
                      </>
                    ) : (
                      <div className="text-[12.5px] text-ink-500">ნომერი ხელმისაწვდომი არ არის</div>
                    )}
                  </div>

                  <div className="col-span-2 lg:col-span-1 rounded-2xl bg-white/85 backdrop-blur-xl border border-ink-200/60 shadow-card p-5">
                    <div className="text-[9.5px] uppercase tracking-[0.16em] font-bold text-ink-400 mb-3">პროფილის შესახებ</div>
                    <dl className="space-y-2.5 text-[12.5px]">
                      <div className="flex items-baseline justify-between gap-3"><dt className="text-ink-500">სერვისები</dt><dd className="text-ink-900 font-bold font-mono tabular-nums">{services.length}</dd></div>
                      {m.mechanic_profile.experience_years ? (
                        <div className="flex items-baseline justify-between gap-3 border-t border-ink-100 pt-2.5"><dt className="text-ink-500">გამოცდილება</dt><dd className="text-ink-900 font-semibold">{m.mechanic_profile.experience_years} წელი</dd></div>
                      ) : null}
                      <div className="flex items-baseline justify-between gap-3 border-t border-ink-100 pt-2.5"><dt className="text-ink-500">შეფასებები</dt><dd className="text-ink-900 font-bold font-mono tabular-nums">{m.mechanic_profile.review_count || 0}</dd></div>
                      {m.mechanic_profile.is_mobile && (
                        <div className="flex items-baseline justify-between gap-3 border-t border-ink-100 pt-2.5"><dt className="text-ink-500">მობილური სერვისი</dt><dd className="text-success-700 font-semibold">კი</dd></div>
                      )}
                    </dl>
                  </div>
                </aside>
              </div>
            </div>
          </section>

          {/* ═════════ TAB STRIP ═════════ */}
          <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-y border-ink-200/60">
            <div className="max-w-[1280px] mx-auto px-4 lg:px-8 h-12 flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {tabs.map((s) => (
                <button key={s.k} type="button" onClick={() => setActiveTab(s.k)} className={`px-3 h-8 rounded-pill text-[12.5px] font-semibold whitespace-nowrap transition inline-flex items-center gap-2 ${activeTab === s.k ? "bg-ink-900 text-white" : "text-ink-600 hover:text-ink-900 hover:bg-ink-100/70"}`}>
                  {s.l}
                  <span className={`px-1.5 py-0.5 rounded-pill text-[10px] font-mono tabular-nums ${activeTab === s.k ? "bg-white/15 text-white" : "bg-ink-100 text-ink-500"}`}>{s.n}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ═════════ CONTENT ═════════ */}
          <section className="bg-ink-50">
            <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8 grid grid-cols-12 gap-5">
              {/* MAIN */}
              <div className="col-span-12 lg:col-span-8 space-y-5">

                {activeTab === "services" && (
                  <div className="rounded-2xl bg-white border border-ink-200/60 overflow-hidden">
                    <div className="px-6 pt-5 pb-3 flex items-end justify-between gap-3 border-b border-ink-100 flex-wrap">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-ink-400">სრული სია</div>
                        <h2 className="mt-1 text-[20px] font-bold tracking-tight text-ink-900">{services.length} სერვისი {fullName}-ისგან.</h2>
                      </div>
                    </div>
                    {services.length > 0 ? (
                      <ul className="divide-y divide-ink-100">
                        {services.map((s, i) => (
                          <li key={s.id} className="group">
                            <button type="button" onClick={() => navigate(serviceUrl(s))} className="w-full px-5 md:px-6 py-3.5 flex items-center gap-4 text-left hover:bg-ink-50/50 transition">
                              <span className="font-mono tabular-nums text-[10px] text-ink-400 font-semibold w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                              <span className="h-9 w-9 rounded-lg bg-brand-50 border border-brand-100 text-brand-700 grid place-items-center shrink-0 group-hover:bg-brand-500 group-hover:border-brand-500 group-hover:text-white transition"><Wrench className="h-4 w-4" /></span>
                              <span className="flex-1 min-w-0">
                                <div className="text-[13.5px] font-semibold text-ink-900 leading-snug truncate">{s.name}</div>
                                {s.service_categories?.name && <div className="text-[11px] text-ink-500 truncate">{s.service_categories.name}</div>}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-pill bg-ink-50 border border-ink-200 text-[11px] font-bold uppercase tracking-wider text-ink-700 shrink-0 hidden sm:inline-flex">{(s.price_from || s.price_to) ? `₾${s.price_from || s.price_to}` : "შეთანხმებით"}</span>
                              <span className="shrink-0 text-ink-400 group-hover:text-ink-900 transition"><ArrowRight className="h-4 w-4" /></span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-6 py-10 text-center text-ink-500 text-[13px]">ამ ხელოსანს ჯერ არ აქვს დამატებული სერვისები</div>
                    )}
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="rounded-2xl bg-white border border-ink-200/60 p-6">
                    <MechanicReviews mechanicId={m.id} onReviewAdded={handleReviewAdded} />
                  </div>
                )}

                {activeTab === "vacancies" && (
                  <div className="rounded-2xl bg-white border border-ink-200/60 overflow-hidden">
                    <div className="px-6 pt-5 pb-3 border-b border-ink-100">
                      <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-ink-400">ვაკანსიები</div>
                      <h2 className="mt-1 text-[20px] font-bold tracking-tight text-ink-900">{vacancies.length} აქტიური ვაკანსია.</h2>
                    </div>
                    <ul className="divide-y divide-ink-100">
                      {vacancies.map((v) => (
                        <li key={v.id}>
                          <button type="button" onClick={() => navigate(`/vacancy/${v.id}`)} className="w-full px-5 md:px-6 py-4 flex items-start gap-3 text-left hover:bg-ink-50/50 transition group">
                            <span className="h-9 w-9 rounded-lg bg-brand-50 border border-brand-100 text-brand-700 grid place-items-center shrink-0"><Briefcase className="h-4 w-4" /></span>
                            <span className="flex-1 min-w-0">
                              <div className="text-[14px] font-bold text-ink-900 group-hover:text-brand-700 transition">{v.title}</div>
                              <div className="text-[11px] text-ink-400 font-mono tabular-nums mt-0.5">{format(new Date(v.created_at), "dd MMM, yyyy")}</div>
                              {v.description && <p className="text-[12.5px] text-ink-600 mt-1.5 line-clamp-2 whitespace-pre-wrap">{v.description}</p>}
                            </span>
                            <span className="shrink-0 text-ink-400 group-hover:text-ink-900 transition"><ArrowRight className="h-4 w-4" /></span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* SIDEBAR */}
              <aside className="col-span-12 lg:col-span-4">
                <div className="lg:sticky lg:top-[68px] space-y-3">
                  {/* About */}
                  <div className="rounded-2xl bg-white border border-ink-200/60 p-5">
                    <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-ink-400 mb-3">ხელოსანი</div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-brand-500 text-white grid place-items-center text-[15px] font-bold tracking-wider shrink-0">{initials || "?"}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-bold text-ink-900 truncate">{fullName}</div>
                        <div className="text-[11.5px] text-ink-500 truncate">{typeLabel}</div>
                      </div>
                    </div>
                    {m.mechanic_profile.description && <p className="mt-4 text-[12.5px] text-ink-600 leading-relaxed whitespace-pre-wrap">{m.mechanic_profile.description}</p>}
                    {hasPhone && <button type="button" onClick={openPhone} className="mt-3 w-full h-10 rounded-btn bg-brand-500 hover:bg-brand-600 text-white text-[12.5px] font-bold inline-flex items-center justify-center gap-2"><Phone className="h-4 w-4" />დაურეკე</button>}
                  </div>

                  {/* Contact info */}
                  <div className="rounded-2xl bg-white border border-ink-200/60 p-5">
                    <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-ink-400 mb-3">საკონტაქტო ინფორმაცია</div>
                    <div className="space-y-3 text-[12.5px]">
                      {m.profile.street && (
                        <div className="flex items-start gap-2.5"><MapPin className="h-4 w-4 text-ink-400 mt-0.5 shrink-0" /><div><div className="text-ink-500 text-[10.5px]">მისამართი</div><div className="text-ink-900 font-medium">{m.profile.street}, {m.profile.city}{m.profile.district ? `, ${m.profile.district}` : ""}</div></div></div>
                      )}
                      {hasPhone && (
                        <div className="flex items-start gap-2.5 border-t border-ink-100 pt-3"><Phone className="h-4 w-4 text-ink-400 mt-0.5 shrink-0" /><div><div className="text-ink-500 text-[10.5px]">ტელეფონი</div><button type="button" onClick={openPhone} className="text-ink-900 font-medium hover:text-brand-700 font-mono tabular-nums">{maskedPhone}</button></div></div>
                      )}
                      {m.profile.email && (
                        <div className="flex items-start gap-2.5 border-t border-ink-100 pt-3"><Mail className="h-4 w-4 text-ink-400 mt-0.5 shrink-0" /><div className="min-w-0"><div className="text-ink-500 text-[10.5px]">ელ-ფოსტა</div><a href={`mailto:${m.profile.email}`} className="text-ink-900 font-medium hover:text-brand-700 break-all">{m.profile.email}</a></div></div>
                      )}
                      {m.mechanic_profile.working_hours && (
                        <div className="flex items-start gap-2.5 border-t border-ink-100 pt-3"><Clock className="h-4 w-4 text-ink-400 mt-0.5 shrink-0" /><div><div className="text-ink-500 text-[10.5px]">სამუშაო საათები</div><div className="text-ink-900 font-medium">{typeof m.mechanic_profile.working_hours === "string" ? m.mechanic_profile.working_hours : "ორშ-პარ: 10:00 - 18:00"}</div></div></div>
                      )}
                    </div>
                  </div>

                  {/* Certificates */}
                  {certificates.length > 0 && (
                    <div className="rounded-2xl bg-white border border-ink-200/60 p-5">
                      <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-ink-400 mb-3">სერტიფიკატები</div>
                      <ul className="space-y-2">
                        {certificates.map((c) => (
                          <li key={c.id} className="flex items-start gap-2 text-[12.5px]">
                            <FileCheck className="h-4 w-4 text-success-600 mt-0.5 shrink-0" />
                            <span className="text-ink-800">{c.title}{c.issuing_organization ? ` — ${c.issuing_organization}` : ""}{c.issue_date ? ` (${format(new Date(c.issue_date), "yyyy")})` : ""}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Specialization */}
                  {m.mechanic_profile.specialization && (
                    <div className="rounded-2xl bg-white border border-ink-200/60 p-5">
                      <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-ink-400 mb-3">სპეციალიზაცია</div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.mechanic_profile.specialization.split(",").map((sp, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-ink-50 border border-ink-200 text-[11.5px] font-semibold text-ink-700"><Car className="h-3 w-3 text-ink-400" />{sp.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </section>

          {/* ═════════ BLOG ═════════ */}
          <section className="bg-white border-t border-ink-200/60">
            <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">
              <RelatedBlogPosts limit={3} />
            </div>
          </section>

          {/* ═════════ MOBILE STICKY ═════════ */}
          {hasPhone && (
            <div className="lg:hidden fixed bottom-[70px] md:bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-xl border-t border-ink-200/60 px-3 py-2.5 flex items-center gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-brand-500 text-white grid place-items-center text-[11px] font-bold shrink-0">{initials || "?"}</div>
                <div className="min-w-0"><div className="text-[12px] font-bold text-ink-900 truncate">{fullName}</div><div className="text-[10px] text-ink-500 truncate">{typeLabel}</div></div>
              </div>
              <button type="button" onClick={openPhone} className="ml-auto h-10 px-4 rounded-pill bg-brand-500 text-white text-[12.5px] font-bold inline-flex items-center gap-1.5 shrink-0"><Phone className="h-3.5 w-3.5" />დაურეკე</button>
            </div>
          )}

          {/* Phone reveal + report */}
          {hasPhone && (
            <PhoneRevealDialog open={phoneOpen} onOpenChange={setPhoneOpen} name={fullName} city={m.profile.city} phone={phone} />
          )}
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
                  {["ცრუ ინფორმაცია", "არ პასუხობს", "არასწორი მონაცემები", "სხვა"].map((r) => (
                    <button key={r} type="button" onClick={() => { toast.success("მადლობა, მიღებულია"); setReportOpen(false); }} className="w-full px-3 py-2.5 rounded-xl border border-ink-200 hover:border-ink-900 text-left text-[12.5px] font-semibold text-ink-900">{r}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
        );
      })()}

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default MechanicProfile;
