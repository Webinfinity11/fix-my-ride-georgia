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
        <div style={{ padding: '32px 0', backgroundColor: '#fefce8', borderTop: '1px solid #fed7aa', borderBottom: '1px solid #fed7aa' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div 
                style={{
                  backgroundColor: 'white',
                  border: '2px solid #fdba74',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => window.location.href = 'tel:+995574047994'}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#fed7aa',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}>
                  <MapPin style={{ width: '32px', height: '32px', color: '#ea580c' }} />
                </div>
                
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px 0' }}>
                  🔧 მირჩიე ხელოسანი
                </h3>
                
                <p style={{ color: '#6b7280', fontSize: '16px', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                  დაგვირეკეთ და ჩვენ მოგარჩევთ შესაფერის ხელოსანს თქვენი საჭიროებისთვის
                </p>
                
                <button
                  style={{
                    backgroundColor: '#ea580c',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                    marginBottom: '12px'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = 'tel:+995574047994';
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ea580c';
                  }}
                >
                  📞 დარეკვა
                </button>
                
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ea580c', marginTop: '8px' }}>
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