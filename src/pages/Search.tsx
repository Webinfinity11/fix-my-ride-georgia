import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import MechanicCard from "@/components/mechanic/MechanicCard";

type MechanicType = {
  id: string;
  profile: {
    first_name: string;
    last_name: string;
    city: string;
    district: string;
  };
  mechanic_profile: {
    description: string | null;
    specialization: string | null;
    experience_years: number | null;
    rating: number | null;
    review_count: number | null; 
    is_mobile: boolean;
  };
  services: {
    id: number;
    name: string;
    category_id: number;
  }[];
};

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mechanics, setMechanics] = useState<MechanicType[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceCategories, setServiceCategories] = useState<{id: number, name: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch service categories for filtering
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("service_categories")
          .select("id, name")
          .order("name", { ascending: true });

        if (categoriesError) throw categoriesError;
        setServiceCategories(categoriesData || []);

        // Fetch mechanics with profile data
        await fetchMechanics();
      } catch (error: any) {
        console.error("Error fetching initial data:", error);
        toast.error("მონაცემების ჩატვირთვისას შეცდომა დაფიქსირდა");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const fetchMechanics = async (query: string = "", categoryId: number | null = null) => {
    try {
      // First get mechanics with their profile info
      const { data: mechanicsData, error: mechanicsError } = await supabase
        .from("profiles")
        .select(`
          id,
          first_name,
          last_name,
          city,
          district,
          mechanic_profiles!inner(description, specialization, experience_years, rating, review_count, is_mobile)
        `)
        .eq("role", "mechanic");

      if (mechanicsError) throw mechanicsError;

      // For each mechanic, get their services
      const mechanicsWithServices = await Promise.all((mechanicsData || []).map(async (mechanic) => {
        const { data: services, error: servicesError } = await supabase
          .from("mechanic_services")
          .select("id, name, category_id")
          .eq("mechanic_id", mechanic.id)
          .eq("is_active", true);
          
        if (servicesError) throw servicesError;
          
        return {
          id: mechanic.id,
          profile: {
            first_name: mechanic.first_name,
            last_name: mechanic.last_name,
            city: mechanic.city,
            district: mechanic.district
          },
          mechanic_profile: mechanic.mechanic_profiles,
          services: services || []
        };
      }));
      
      // Filter by search query if provided
      let filteredMechanics = mechanicsWithServices;
      
      if (query) {
        const lowerQuery = query.toLowerCase();
        filteredMechanics = filteredMechanics.filter(mechanic => 
          mechanic.profile.first_name.toLowerCase().includes(lowerQuery) ||
          mechanic.profile.last_name.toLowerCase().includes(lowerQuery) ||
          (mechanic.mechanic_profile.specialization && 
           mechanic.mechanic_profile.specialization.toLowerCase().includes(lowerQuery))
        );
      }
      
      // Filter by category if provided
      if (categoryId) {
        filteredMechanics = filteredMechanics.filter(mechanic => 
          mechanic.services.some(service => service.category_id === categoryId)
        );
      }

      setMechanics(filteredMechanics);
    } catch (error: any) {
      console.error("Error fetching mechanics:", error);
      toast.error("ხელოსნების ჩატვირთვისას შეცდომა დაფიქსირდა");
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchMechanics(searchQuery, selectedCategory)
      .finally(() => setLoading(false));
  };

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    setLoading(true);
    fetchMechanics(searchQuery, categoryId === selectedCategory ? null : categoryId)
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">ხელოსნების ძიება</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
              <div className="flex flex-col md:flex-row gap-2">
                <Input 
                  placeholder="ჩაწერეთ სპეციალობა ან მომსახურება..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-grow"
                />
                <Button onClick={handleSearch}>
                  <SearchIcon className="h-4 w-4 mr-2" />
                  ძიება
                </Button>
              </div>

              {serviceCategories.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">კატეგორიები:</p>
                  <div className="flex flex-wrap gap-2">
                    {serviceCategories.map(category => (
                      <Button 
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleCategoryChange(category.id)}
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {loading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-6">
                    <div className="flex gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-6 w-1/3 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-1" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : mechanics.length > 0 ? (
              <div className="space-y-6">
                {mechanics.map(mechanic => (
                  <MechanicCard
                    key={mechanic.id}
                    id={mechanic.id}
                    name={`${mechanic.profile.first_name} ${mechanic.profile.last_name}`}
                    specialization={mechanic.mechanic_profile.specialization || "ავტოხელოსანი"}
                    location={`${mechanic.profile.city}${mechanic.profile.district ? `, ${mechanic.profile.district}` : ''}`}
                    rating={mechanic.mechanic_profile.rating || 0}
                    reviewCount={mechanic.mechanic_profile.review_count ? Number(mechanic.mechanic_profile.review_count) : 0}
                    verified={true}
                    isMobile={mechanic.mechanic_profile.is_mobile}
                    experience={mechanic.mechanic_profile.experience_years || 0}
                    description={mechanic.mechanic_profile.description || ""}
                    services={mechanic.services.map(s => s.name).slice(0, 3)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">მოძებნეთ საუკეთესო ავტოხელოსანი თქვენი მანქანისთვის</p>
                {searchQuery || selectedCategory ? (
                  <p className="mt-4">ძიების შედეგად ხელოსნები ვერ მოიძებნა. სცადეთ სხვა პარამეტრებით ძიება.</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SearchPage;
