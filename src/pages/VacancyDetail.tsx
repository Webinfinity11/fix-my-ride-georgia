import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase, Calendar, MapPin, Star, Phone, MessageCircle, User, Check, Wrench } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import SEOHead from "@/components/seo/SEOHead";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";
import { generateSEOTitle, generateSEODescription, generateCanonicalURL } from "@/utils/seoUtils";
import { createMechanicSlug } from "@/utils/slugUtils";

type VacancyType = {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  mechanic_id: string;
};

type MechanicType = {
  id: string;
  first_name: string;
  last_name: string;
  city: string;
  district: string;
  phone: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  mechanic_profiles: {
    display_id: number;
    rating: number | null;
    review_count: number;
    specialization: string | null;
    description: string | null;
    experience_years: number | null;
    is_mobile: boolean | null;
  } | null;
};

const VacancyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vacancy, setVacancy] = useState<VacancyType | null>(null);
  const [mechanic, setMechanic] = useState<MechanicType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate("/vacancies");
      return;
    }

    const fetchVacancyData = async () => {
      setLoading(true);
      try {
        // Fetch vacancy
        const { data: vacancyData, error: vacancyError } = await supabase
          .from("mechanic_vacancies")
          .select("*")
          .eq("id", parseInt(id))
          .eq("is_active", true)
          .single();

        if (vacancyError) throw vacancyError;
        setVacancy(vacancyData);

        // Fetch mechanic
        const { data: mechanicData, error: mechanicError } = await supabase
          .from("profiles")
          .select(`
            id,
            first_name,
            last_name,
            city,
            district,
            phone,
            avatar_url,
            is_verified,
            mechanic_profiles (
              display_id,
              rating,
              review_count,
              specialization,
              description,
              experience_years,
              is_mobile
            )
          `)
          .eq("id", vacancyData.mechanic_id)
          .eq("role", "mechanic")
          .single();

        if (mechanicError) throw mechanicError;
        setMechanic(mechanicData);
      } catch (error) {
        console.error("Error fetching vacancy data:", error);
        toast.error("ვაკანსიის მონაცემების ჩატვირთვისას შეცდომა დაფიქსირდა");
        navigate("/vacancies");
      } finally {
        setLoading(false);
      }
    };

    fetchVacancyData();
  }, [id, navigate]);

  const handleStartChat = async () => {
    if (!user) {
      toast.error("ჩატისთვის საჭიროა ავტორიზაცია");
      navigate("/login");
      return;
    }

    if (!mechanic) return;

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
        for (const chat of existingChats) {
          const participantIds = chat.chat_participants.map((p: any) => p.user_id);
          if (participantIds.includes(user.id) && participantIds.includes(mechanic.id) && participantIds.length === 2) {
            existingChatId = chat.id;
            break;
          }
        }
      }

      if (!existingChatId) {
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

        const { error: participantsError } = await supabase
          .from('chat_participants')
          .insert([
            { room_id: newRoom.id, user_id: user.id },
            { room_id: newRoom.id, user_id: mechanic.id }
          ]);

        if (participantsError) {
          console.error('Error adding participants:', participantsError);
          toast.error('მონაწილეების დამატებისას შეცდომა დაფიქსირდა');
          return;
        }

        existingChatId = newRoom.id;
      }

      navigate(`/chat?room=${existingChatId}`);
      toast.success(`${mechanic.first_name}-თან ჩატი გაიხსნა`);
    } catch (error) {
      console.error('Error creating direct chat:', error);
      toast.error("ჩატის გახსნისას შეცდომა დაფიქსირდა");
    }
  };

  const handleViewMechanic = () => {
    if (mechanic?.mechanic_profiles?.display_id) {
      const slug = createMechanicSlug(
        mechanic.mechanic_profiles.display_id,
        mechanic.first_name,
        mechanic.last_name
      );
      navigate(`/mechanic/${slug}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-muted py-8">
          <div className="container mx-auto px-4">
            <Skeleton className="h-12 w-3/4 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-8 w-1/2 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-20 rounded-full mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!vacancy || !mechanic) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-muted flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <h1 className="text-2xl font-bold mb-4">ვაკანსია ვერ მოიძებნა</h1>
            <p className="mb-6">მოთხოვნილი ვაკანსია არ არსებობს ან წაშლილია.</p>
            <Button onClick={() => navigate("/vacancies")}>
              დაბრუნება ვაკანსიებზე
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const canonicalUrl = `https://fixup.ge/vacancy/${vacancy.id}`;
  const pageTitle = `${vacancy.title} - ვაკანსია | ${mechanic.first_name} ${mechanic.last_name}`;
  const pageDescription = vacancy.description
    ? `${vacancy.description.substring(0, 150)}...`
    : `სამუშაო ვაკანსია: ${vacancy.title}. ხელოსანი: ${mechanic.first_name} ${mechanic.last_name}, ${mechanic.city}.`;

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        keywords={`ვაკანსია, სამუშაო, ${vacancy.title}, ${mechanic.city}, ავტოსერვისი, დასაქმება`}
        url={canonicalUrl}
        canonical={canonicalUrl}
        type="article"
      />

      <BreadcrumbSchema items={[
        { name: 'მთავარი', url: 'https://fixup.ge/' },
        { name: 'ვაკანსიები', url: 'https://fixup.ge/vacancies' },
        { name: vacancy.title, url: canonicalUrl }
      ]} />

      <Header />

      <main className="flex-grow bg-muted py-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
              <button onClick={() => navigate("/")} className="hover:text-primary">
                მთავარი
              </button>
              <span>/</span>
              <button onClick={() => navigate("/vacancies")} className="hover:text-primary">
                ვაკანსიები
              </button>
              <span>/</span>
              <span className="text-foreground">{vacancy.title}</span>
            </nav>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-6">
                    <Briefcase className="h-8 w-8 text-primary mt-1" />
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold mb-2">{vacancy.title}</h1>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>გამოქვეყნდა: {format(new Date(vacancy.created_at), "dd MMMM, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{mechanic.city}{mechanic.district ? `, ${mechanic.district}` : ""}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {vacancy.description && (
                    <div className="border-t pt-6">
                      <h2 className="text-xl font-semibold mb-4">სამუშაოს აღწერა</h2>
                      <div className="prose max-w-none">
                        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {vacancy.description}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Mechanic Info */}
            <div>
              <Card className="sticky top-20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">დამსაქმებელი</h3>

                  <div className="flex items-start gap-3 mb-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={mechanic.avatar_url || ""} alt={`${mechanic.first_name} ${mechanic.last_name}`} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {mechanic.first_name.charAt(0)}{mechanic.last_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">
                          {mechanic.first_name} {mechanic.last_name}
                        </h4>
                        {mechanic.is_verified && (
                          <Badge variant="secondary" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            დადასტურებული
                          </Badge>
                        )}
                      </div>
                      {mechanic.mechanic_profiles?.specialization && (
                        <p className="text-sm text-muted-foreground">
                          {mechanic.mechanic_profiles.specialization}
                        </p>
                      )}
                    </div>
                  </div>

                  {mechanic.mechanic_profiles?.rating && (
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">
                        {mechanic.mechanic_profiles.rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({mechanic.mechanic_profiles.review_count} შეფასება)
                      </span>
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {mechanic.city}{mechanic.district ? `, ${mechanic.district}` : ""}
                      </span>
                    </div>
                    {mechanic.mechanic_profiles?.experience_years && (
                      <div className="flex items-center gap-2 text-sm">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        <span>{mechanic.mechanic_profiles.experience_years} წლიანი გამოცდილება</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={handleStartChat}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      მიწერა
                    </Button>
                    {mechanic.phone && (
                      <Button
                        variant="outline"
                        className="w-full"
                        asChild
                      >
                        <a href={`tel:${mechanic.phone}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          დარეკვა
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleViewMechanic}
                    >
                      <User className="h-4 w-4 mr-2" />
                      პროფილის ნახვა
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VacancyDetail;
