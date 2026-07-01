import { useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import ServiceCard from "@/components/services/ServiceCard";
import ServiceCardSkeleton from "@/components/services/ServiceCardSkeleton";
import { useServices } from "@/hooks/useServices";
import { useSavedServices } from "@/hooks/useSavedServices";
import SEOHead from "@/components/seo/SEOHead";

const Saved = () => {
  const { services, loading, fetchServices } = useServices();
  const { savedServiceIds } = useSavedServices();

  useEffect(() => {
    fetchServices({
      searchTerm: "",
      selectedCategory: "all",
      selectedCity: null,
      selectedDistrict: null,
      selectedBrands: [],
      onSiteOnly: false,
      minRating: null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savedServices = services.filter((s) => savedServiceIds.has(s.id));

  return (
    <>
      <SEOHead
        title="შენახული სერვისები"
        description="შენ მიერ შენახული ავტოსერვისები ერთ ადგილას."
        url="https://fixup.ge/saved"
        canonical="https://fixup.ge/saved"
      />
      <Layout>
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Bookmark className="h-6 w-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">შენახული სერვისები</h1>
            </div>

            {loading ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <ServiceCardSkeleton key={i} />
                ))}
              </div>
            ) : savedServices.length > 0 ? (
              <>
                <p className="text-muted-foreground mb-4">
                  ნაპოვნია <span className="font-semibold text-primary">{savedServices.length}</span> შენახული სერვისი
                </p>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {savedServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                    <Bookmark className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">ჯერ არაფერი გაქვს შენახული</h3>
                  <p className="text-muted-foreground mb-6">
                    სერვისის გვერდზე დააჭირე „შენახვა" ღილაკს და ის აქ გამოჩნდება — რეგისტრაცია არ არის საჭირო.
                  </p>
                  <Link to="/services">
                    <Button>სერვისების დათვალიერება</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Saved;
