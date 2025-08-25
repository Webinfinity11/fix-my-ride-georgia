import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ServiceCategories from "@/components/home/ServiceCategories";
import SEOHead from "@/components/seo/SEOHead";
import { generateStructuredData, generateSEOTitle, generateSEODescription } from "@/utils/seoUtils";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
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
    console.log('Services component mounted!');
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories...');
        const { data, error } = await supabase
          .from("service_categories")
          .select("*")
          .order("id", { ascending: true });

        if (error) throw error;
        setCategories(data || []);
        console.log('Categories loaded:', data?.length);
      } catch (error: any) {
        console.error("Error fetching service categories:", error);
        toast.error("სერვისების კატეგორიების ჩატვირთვისას შეცდომა დაფიქსირდა");
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  console.log('Render - loading:', loading, 'categories:', categories.length);

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

        <div className="container mx-auto px-4 py-8">
          <div 
            onClick={() => window.location.href = 'tel:+995574047994'}
            className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl p-8 text-center cursor-pointer hover:from-orange-500 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="text-4xl">🔧</div>
              <h2 className="text-2xl font-bold text-white mb-2">მირჩიე ხელოსანი</h2>
              <p className="text-white/90 mb-4">დაგვირეკეთ და ჩვენ მოგარჩევთ შესაფერის ხელოსანს</p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <span className="text-white font-semibold text-lg">+995 574 04 79 94</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = 'tel:+995574047994';
                  }}
                  className="bg-white text-orange-500 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors duration-200 shadow-md"
                >
                  დარეკვა
                </button>
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