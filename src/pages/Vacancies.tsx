import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { OrganizationSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { generateSEOTitle, generateSEODescription, generateCanonicalURL } from "@/utils/seoUtils";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Calendar, MapPin, User, Star } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type VacancyWithMechanic = {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  mechanic_id: string;
  mechanic: {
    id: string;
    first_name: string;
    last_name: string;
    city: string;
    district: string;
    avatar_url: string | null;
    is_verified: boolean;
    mechanic_profiles: {
      display_id: number;
      rating: number | null;
      review_count: number;
      specialization: string | null;
    } | null;
  };
};

const Vacancies = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vacancies, setVacancies] = useState<VacancyWithMechanic[]>([]);

  useEffect(() => {
    const fetchVacancies = async () => {
      try {
        const { data, error } = await supabase
          .from("mechanic_vacancies")
          .select(`
            id,
            title,
            description,
            created_at,
            mechanic_id,
            profiles!mechanic_vacancies_mechanic_id_fkey (
              id,
              first_name,
              last_name,
              city,
              district,
              avatar_url,
              is_verified,
              mechanic_profiles (
                display_id,
                rating,
                review_count,
                specialization
              )
            )
          `)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Transform the data to match our type
        const formattedVacancies: VacancyWithMechanic[] = (data || []).map((vacancy: any) => ({
          id: vacancy.id,
          title: vacancy.title,
          description: vacancy.description,
          created_at: vacancy.created_at,
          mechanic_id: vacancy.mechanic_id,
          mechanic: {
            id: vacancy.profiles.id,
            first_name: vacancy.profiles.first_name,
            last_name: vacancy.profiles.last_name,
            city: vacancy.profiles.city,
            district: vacancy.profiles.district,
            avatar_url: vacancy.profiles.avatar_url,
            is_verified: vacancy.profiles.is_verified,
            mechanic_profiles: vacancy.profiles.mechanic_profiles
          }
        }));

        setVacancies(formattedVacancies);
      } catch (error: any) {
        console.error("Error fetching vacancies:", error);
        toast.error("ვაკანსიების ჩატვირთვისას შეცდომა დაფიქსირდა");
      } finally {
        setLoading(false);
      }
    };

    fetchVacancies();
  }, []);

  const canonicalUrl = generateCanonicalURL('vacancies', {});

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 py-12">
            <div className="container mx-auto px-4">
              <Skeleton className="h-12 w-64 mx-auto mb-4" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
          </div>
          <div className="container mx-auto px-4 py-12">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={generateSEOTitle('vacancies', {})}
        description={generateSEODescription('vacancies', {})}
        keywords="სამუშაო ვაკანსიები, ხელოსნები, ავტოსერვისი, სამუშაო, დასაქმება, საქართველო, თბილისი"
        url={canonicalUrl}
        canonical={canonicalUrl}
        type="website"
      />

      <OrganizationSchema
        name="ავტოხელოსანი - ვაკანსიები"
        url={canonicalUrl}
        description="იპოვეთ სამუშაო ავტოსერვისის სფეროში"
        contactPoint={{
          contactType: "customer service",
          email: "info@fixup.ge"
        }}
      />

      <BreadcrumbSchema items={[
        { name: 'მთავარი', url: 'https://fixup.ge/' },
        { name: 'ვაკანსიები', url: 'https://fixup.ge/vacancies' }
      ]} />

      <Header />

      <main className="flex-grow">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">სამუშაო ვაკანსიები</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                იპოვეთ სამუშაო ავტოსერვისის სფეროში. ხელოსნები ეძებენ კვალიფიციურ თანამშრომლებს.
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {vacancies.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">ვაკანსიები არ მოიძებნა</h2>
              <p className="text-muted-foreground">
                ამჟამად აქტიური ვაკანსიები არ არის. გთხოვთ შეამოწმოთ მოგვიანებით.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-muted-foreground">
                  ნაპოვნია {vacancies.length} ვაკანსია
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {vacancies.map((vacancy) => (
                  <Card
                    key={vacancy.id}
                    className="group hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <Briefcase className="h-6 w-6 text-primary mt-1 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                            {vacancy.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            გამოქვეყნდა: {format(new Date(vacancy.created_at), "dd MMM, yyyy")}
                          </p>
                        </div>
                      </div>

                      {vacancy.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {vacancy.description}
                        </p>
                      )}

                      <div className="border-t pt-4 mt-4">
                        <div className="flex items-start gap-3 mb-3">
                          <User className="h-4 w-4 text-muted-foreground mt-1" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {vacancy.mechanic.first_name} {vacancy.mechanic.last_name}
                              {vacancy.mechanic.is_verified && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  დადასტურებული
                                </Badge>
                              )}
                            </p>
                            {vacancy.mechanic.mechanic_profiles?.specialization && (
                              <p className="text-xs text-muted-foreground">
                                {vacancy.mechanic.mechanic_profiles.specialization}
                              </p>
                            )}
                          </div>
                        </div>

                        {vacancy.mechanic.mechanic_profiles?.rating && (
                          <div className="flex items-center gap-1 mb-3 text-sm">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{vacancy.mechanic.mechanic_profiles.rating.toFixed(1)}</span>
                            <span className="text-muted-foreground">
                              ({vacancy.mechanic.mechanic_profiles.review_count})
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {vacancy.mechanic.city}
                            {vacancy.mechanic.district ? `, ${vacancy.mechanic.district}` : ""}
                          </span>
                        </div>

                        <Button
                          className="w-full"
                          onClick={() => navigate(`/vacancy/${vacancy.id}`)}
                        >
                          დეტალურად ნახვა
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Vacancies;
