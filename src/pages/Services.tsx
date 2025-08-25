import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ServiceCategories from "@/components/home/ServiceCategories";
import SEOHead from "@/components/seo/SEOHead";
import { generateStructuredData, generateSEOTitle, generateSEODescription } from "@/utils/seoUtils";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
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
        keywords="ავტოსერვისი, მექანიკოსი, ავტომობილის რემონტი, მომსახურება, საქართველო, თბილისი"
        url="https://fixup.ge/services"
        canonical="https://fixup.ge/services"
        structuredData={structuredData}
      />
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

        {/* სარეკლამო გრაფა - მირჩიე ხელოსანი */}
        <div className="py-8 bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto">
              <div 
                className="bg-white rounded-lg shadow-lg border-2 border-orange-200 p-6 text-center cursor-pointer hover:shadow-xl transition-all duration-300"
                onClick={() => window.location.href = 'tel:+995574047994'}
              >
                <div className="mb-4">
                  <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">🔧 მირჩიე ხელოსანი</h3>
                  <p className="text-gray-600 mb-4">
                    დაგვირეკეთ და ჩვენ მოგარჩევთ შესაფერის ხელოსანს თქვენი საჭიროებისთვის
                  </p>
                </div>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = 'tel:+995574047994';
                  }}
                >
                  📞 დარეკვა
                </Button>
                <div className="mt-3 text-lg font-bold text-orange-600">
                  +995 574 04 79 94
                </div>
              </div>
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