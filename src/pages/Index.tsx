
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import ServiceCategories from "@/components/home/ServiceCategories";
import HowItWorks from "@/components/home/HowItWorks";
import { Button } from "@/components/ui/button";
import MechanicCard from "@/components/mechanic/MechanicCard";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ServiceFilters from "@/components/services/ServiceFilters";

// Sample featured mechanics data
const featuredMechanics = [
  {
    id: "1",
    name: "გიორგი გიორგაძე",
    avatar: "",
    specialization: "ძრავის სპეციალისტი",
    location: "თბილისი, საბურთალო",
    rating: 4.8,
    reviewCount: 124,
    verified: true,
    services: ["ძრავის შეკეთება", "დიაგნოსტიკა", "ელექტროობა"]
  },
  {
    id: "2",
    name: "ნიკა მაისურაძე",
    avatar: "",
    specialization: "საჭის სისტემა, სამუხრუჭე სისტემა",
    location: "თბილისი, ვაკე",
    rating: 4.6,
    reviewCount: 98,
    verified: true,
    services: ["საჭის სისტემა", "სამუხრუჭე სისტემა", "საკიდი"]
  },
  {
    id: "3",
    name: "თემურ კახიძე",
    avatar: "",
    specialization: "ელექტრო სისტემების სპეციალისტი",
    location: "თბილისი, დიდუბე",
    rating: 4.7,
    reviewCount: 87,
    verified: false,
    services: ["ელექტროობა", "კომპიუტერული დიაგნოსტიკა", "სტარტერი და გენერატორი"]
  }
];

type ServiceCategory = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
};

const Index = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [onSiteOnly, setOnSiteOnly] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("service_categories")
          .select("*")
          .order("id", { ascending: true })
          .limit(6); // Show only first 6 categories on homepage

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch cities
        const { data: servicesData, error: servicesError } = await supabase
          .from("mechanic_services")
          .select("city")
          .not("city", "is", null);

        if (servicesError) throw servicesError;
        
        const uniqueCities = Array.from(
          new Set(servicesData?.map(s => s.city).filter(Boolean) as string[])
        ).sort();
        setCities(uniqueCities);

        // Fetch districts for Tbilisi
        if (selectedCity === "თბილისი") {
          const { data: districtsData, error: districtsError } = await supabase
            .from("mechanic_services")
            .select("district")
            .eq("city", "თბილისი")
            .not("district", "is", null);

          if (districtsError) throw districtsError;
          
          const uniqueDistricts = Array.from(
            new Set(districtsData?.map(s => s.district).filter(Boolean) as string[])
          ).sort();
          setDistricts(uniqueDistricts);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCity]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (searchTerm) params.set("q", searchTerm);
    if (selectedCategory !== "all") params.set("category", selectedCategory.toString());
    if (selectedCity) params.set("city", selectedCity);
    if (selectedDistrict) params.set("district", selectedDistrict);
    if (selectedBrands.length > 0) params.set("brands", selectedBrands.join(","));
    if (onSiteOnly) params.set("onSite", "true");
    if (minRating) params.set("minRating", minRating.toString());
    
    navigate(`/services-detail?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedCity(null);
    setSelectedDistrict(null);
    setSelectedBrands([]);
    setOnSiteOnly(false);
    setMinRating(null);
  };

  // Fetch all categories for the filter
  const [allCategories, setAllCategories] = useState<ServiceCategory[]>([]);

  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("service_categories")
          .select("*")
          .order("name", { ascending: true });

        if (error) throw error;
        setAllCategories(data || []);
      } catch (error: any) {
        console.error("Error fetching all categories:", error);
      }
    };

    fetchAllCategories();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <Hero />
        
        <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4">მოძებნეთ სასურველი სერვისი</h2>
              <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
                გამოიყენეთ ჩვენი მოწინავე ძიების სისტემა, რომ მოძებნოთ თქვენი საჭიროებისთვის შესაფერისი სერვისი
              </p>
              
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <ServiceFilters
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  categories={allCategories}
                  selectedCity={selectedCity}
                  setSelectedCity={setSelectedCity}
                  cities={cities}
                  selectedDistrict={selectedDistrict}
                  setSelectedDistrict={setSelectedDistrict}
                  districts={districts}
                  selectedBrands={selectedBrands}
                  setSelectedBrands={setSelectedBrands}
                  onSiteOnly={onSiteOnly}
                  setOnSiteOnly={setOnSiteOnly}
                  minRating={minRating}
                  setMinRating={setMinRating}
                  onSearch={handleSearch}
                  onResetFilters={handleResetFilters}
                />
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">ჩვენი სერვისები</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                აღმოაჩინეთ ჩვენი მრავალფეროვანი სერვისები ავტომობილებისთვის. ჩვენ გთავაზობთ მაღალი ხარისხის მომსახურებას სხვადასხვა საჭიროებისთვის.
              </p>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-muted rounded-lg p-6 animate-pulse">
                    <div className="h-12 w-12 bg-primary/20 rounded-full mb-4"></div>
                    <div className="h-6 bg-primary/20 rounded mb-2"></div>
                    <div className="h-4 bg-primary/20 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <ServiceCategories categories={categories} />
            )}
            
            <div className="text-center mt-8">
              <Link to="/services-detail">
                <Button variant="outline" size="lg">
                  ყველა სერვისის ნახვა
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <HowItWorks />

        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">რეკომენდირებული ხელოსნები</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                გაეცანით ჩვენს საუკეთესო ხელოსნებს, რომლებიც გამოირჩევიან მაღალი პროფესიონალიზმითა და საიმედოობით.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {featuredMechanics.map((mechanic) => (
                <MechanicCard 
                  key={mechanic.id} 
                  id={mechanic.id}
                  name={mechanic.name}
                  avatar={mechanic.avatar}
                  specialization={mechanic.specialization}
                  location={mechanic.location}
                  rating={mechanic.rating}
                  reviewCount={mechanic.reviewCount}
                  verified={mechanic.verified}
                  services={mechanic.services}
                />
              ))}
            </div>
            
            <div className="text-center">
              <Link to="/services-detail">
                <Button size="lg">
                  ყველა ხელოსნის ნახვა
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
