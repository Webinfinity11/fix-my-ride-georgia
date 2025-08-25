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

  const handleCallCraftsman = () => {
    window.location.href = 'tel:+995574047994';
  };

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
        
        {/* Choose Craftsman Promotional Section */}
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-y border-amber-200">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <div 
                className="bg-white shadow-lg border border-amber-300 rounded-xl p-8 text-center cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                onClick={handleCallCraftsman}
              >
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-full p-4 shadow-lg">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  🔧 მირჩიე ხელოსანი
                </h3>
                <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                  არ იცი რომელი სერვისი მოგირჩევნია? დაგვირეკეთ და ჩვენი ექსპერტი კონსულტანტები მოგარჩევენ იდეალურ ხელოსანს თქვენი საჭიროებისთვის
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                  <Button 
                    variant="default" 
                    size="lg"
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCallCraftsman();
                    }}
                  >
                    📞 დარეკვა ახლავე
                  </Button>
                  <span className="text-xl font-bold text-amber-600">+995 574 04 79 94</span>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  ✅ უფასო კონსულტაცია • ⚡ სწრაფი პასუხი • 🏆 გარანტირებული ხარისხი
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