
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ServiceCategories from "@/components/home/ServiceCategories";
import SEOHead from "@/components/seo/SEOHead";
import { OrganizationSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { generateStructuredData, generateSEOTitle, generateSEODescription, generateCanonicalURL } from "@/utils/seoUtils";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import { PhoneCall } from "lucide-react";
import { toast } from "sonner";

type ServiceCategory = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
};

const Services = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("service_categories")
          .select("*")
          .order("id", { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } catch (error: any) {
        console.error("Error fetching service categories:", error);
        toast.error("სერვისების კატეგორიების ჩატვირთვისას შეცდომა დაფიქსირდა");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const canonicalUrl = generateCanonicalURL('services', {});
  const structuredData = generateStructuredData('Organization', {
    name: 'ავტოხელოსანი - ავტოსერვისები',
    description: 'მრავალფეროვანი ავტოსერვისები საქართველოში',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'ავტოსერვისების კატეგორიები',
      itemListElement: categories.map(category => ({
        '@type': 'Offer',
        name: category.name,
        description: category.description,
        url: `https://fixup.ge/category/${category.id}`
      }))
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={generateSEOTitle('services', {})}
        description={generateSEODescription('services', {})}
        keywords="ავტოსერვისი, მექანიკოსი, ავტომობილის რემონტი, მომსახურება, საქართველო, თბილისი, fixup"
        url={canonicalUrl}
        canonical={canonicalUrl}
        type="website"
      />
      
      <OrganizationSchema 
        name="ავტოხელოსანი - სერვისები"
        url={canonicalUrl}
        description="მრავალფეროვანი ავტოსერვისები საქართველოში"
        contactPoint={{
          contactType: "customer service",
          email: "info@fixup.ge"
        }}
      />
      
      <BreadcrumbSchema items={[
        { name: 'მთავარი', url: 'https://fixup.ge/' },
        { name: 'სერვისები', url: 'https://fixup.ge/services' }
      ]} />
      <Header />
      
      <main className="flex-grow">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-6 text-center">ჩვენი სერვისები</h1>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-6">
              აღმოაჩინეთ ჩვენი მრავალფეროვანი სერვისები ავტომობილებისთვის. ჩვენ გთავაზობთ მაღალი ხარისხის მომსახურებას სხვადასხვა საჭიროებისთვის.
            </p>
            <p className="text-center max-w-2xl mx-auto mb-12">
              ქვემოთ იხილეთ ჩვენი სერვისების სრული ჩამონათვალი. დააჭირეთ სასურველ სერვისს, რომ ნახოთ შესაბამისი ხელოსნების სია.
            </p>
          </div>
        </div>

        {/* Choose a Craftsman Promotional Banner */}
        <div className="container mx-auto px-4 py-8">
          <div 
            onClick={() => window.location.href = 'tel:+995574047994'}
            className="bg-gradient-to-r from-secondary to-secondary/80 rounded-xl p-6 md:p-8 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-white">
                <div className="bg-white/20 rounded-full p-3">
                  <PhoneCall className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">🔧 მირჩიე ხელოსანი</h3>
                  <p className="text-white/90 mb-2">დაგვირეკეთ და ჩვენ შეგირჩევთ შესაფერის ხელოსანს თქვენი საჭიროებისთვის</p>
                  <p className="text-lg font-semibold">+995 574 04 79 94</p>
                </div>
              </div>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = 'tel:+995574047994';
                }}
                variant="secondary"
                size="lg"
                className="bg-white text-secondary hover:bg-white/90 font-semibold px-8 py-3 shrink-0"
              >
                <PhoneCall className="mr-2 h-5 w-5" />
                დარეკვა
              </Button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-background rounded-lg p-6">
                  <Skeleton className="h-12 w-12 rounded-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ServiceCategories categories={categories} />
        )}
      </main>
      
      <Footer />
      
    </div>
  );
};

export default Services;
