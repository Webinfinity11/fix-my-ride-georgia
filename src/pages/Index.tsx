
import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import HeroSection from "@/components/home/HeroSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/seo/SEOHead";
import { generateSEOTitle, generateSEODescription } from "@/utils/seoUtils";
import { 
  Zap, 
  Shield, 
  Users, 
  Star,
  MapPin,
  UserPlus,
  Wrench,
  Car,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

// Lazy load non-critical components
const ServiceCategories = lazy(() => import("@/components/home/ServiceCategories"));
const ModernServiceFilters = lazy(() => import("@/components/services/ModernServiceFilters"));
const MechanicCard = lazy(() => import("@/components/mechanic/MechanicCard").then(module => ({ default: module.MechanicCard })));

type ServiceCategory = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
};

type FeaturedMechanic = {
  id: string;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
    city?: string;
    district?: string;
  };
  specialization?: string;
  rating?: number;
  review_count?: number;
};

// საქართველოს მთავარი ქალაქები
const georgianCities = [
  "თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "გორი",
  "ზუგდიდი", "ფოთი", "ხაშური", "სამტრედია", "ოზურგეთი"
];

// პოპულარული ძიებები
const popularSearches = [
  "ძრავის შეკეთება", "ელექტროობა", "დიაგნოსტიკა", "ზეთის შეცვლა"
];

// სტატისტიკა
const stats = [
  { number: "2,500+", label: "ხელოსანი", icon: Users },
  { number: "15,000+", label: "სერვისი", icon: Zap },
  { number: "50,000+", label: "მომხმარებელი", icon: Shield },
  { number: "4.8★", label: "საშუალო რეიტინგი", icon: Star },
];

const Index = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [featuredMechanics, setFeaturedMechanics] = useState<FeaturedMechanic[]>([]);
  const [cities, setCities] = useState<string[]>(georgianCities);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mechanicsLoading, setMechanicsLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [onSiteOnly, setOnSiteOnly] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch all data in parallel to reduce critical request chain
        const [categoriesResponse, mechanicsResponse, allCategoriesResponse] = await Promise.all([
          supabase
            .from("service_categories")
            .select("*")
            .order("id", { ascending: true })
            .limit(8),
          supabase
            .from("mechanic_profiles")
            .select(`
              id,
              specialization,
              rating,
              review_count,
              profiles!inner (
                first_name,
                last_name,
                avatar_url,
                city,
                district
              )
            `)
            .gte("rating", 4.0)
            .not("rating", "is", null)
            .order("rating", { ascending: false })
            .order("review_count", { ascending: false })
            .limit(6),
          supabase
            .from("service_categories")
            .select("*")
            .order("name", { ascending: true })
        ]);

        // Handle categories
        if (categoriesResponse.error) throw categoriesResponse.error;
        setCategories(categoriesResponse.data || []);

        // Handle all categories
        if (allCategoriesResponse.error) throw allCategoriesResponse.error;
        setAllCategories(allCategoriesResponse.data || []);

        // Handle mechanics
        if (mechanicsResponse.error) throw mechanicsResponse.error;
        
        if (mechanicsResponse.data && mechanicsResponse.data.length > 0) {
          const transformedMechanics: FeaturedMechanic[] = mechanicsResponse.data.map(mechanic => ({
            id: mechanic.id,
            profiles: {
              first_name: mechanic.profiles.first_name,
              last_name: mechanic.profiles.last_name,
              avatar_url: mechanic.profiles.avatar_url,
              city: mechanic.profiles.city,
              district: mechanic.profiles.district,
            },
            specialization: mechanic.specialization,
            rating: mechanic.rating,
            review_count: mechanic.review_count,
          }));
          setFeaturedMechanics(transformedMechanics);
        }

        // თბილისის უბნების fetch თუ თბილისია არჩეული
        if (selectedCity === "თბილისი") {
          const tbilisiDistricts = [
            "ვაკე", "საბურთალო", "ვერე", "გლდანი", "ისანი", "ნაძალადევი",
            "ძველი თბილისი", "აბანოთუბანი", "ავლაბარი", "ჩუღურეთი", "სამგორი",
            "დიღომი", "ვაშლიჯვარი", "მთაწმინდა", "კრწანისი", "ავჭალა",
            "ლილო", "ორთაჭალა", "დიდუბე", "ფონიჭალა"
          ];
          setDistricts(tbilisiDistricts);
        } else {
          setDistricts([]);
        }

      } catch (error: any) {
        console.error("Error fetching data:", error);
        setFeaturedMechanics([]);
      } finally {
        setLoading(false);
        setMechanicsLoading(false);
      }
    };

    // Defer API calls to break critical request chain and improve FCP
    const timeoutId = setTimeout(() => {
      fetchInitialData();
    }, 0);

    return () => clearTimeout(timeoutId);
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
    
    navigate(`/services?${params.toString()}`);
  };

  const handleQuickSearch = (query: string) => {
    const params = new URLSearchParams();
    params.set("q", query);
    navigate(`/services?${params.toString()}`);
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

  // All categories state (now loaded in parallel with other data)
  const [allCategories, setAllCategories] = useState<ServiceCategory[]>([]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50 pb-[70px] md:pb-0">
      <SEOHead
        title={generateSEOTitle('home', {})}
        description={generateSEODescription('home', {})}
        keywords="ავტოხელოსანი, ავტოსერვისი, მექანიკოსი, ავტომობილის რემონტი, საქართველო, თბილისი"
        url="https://fixup.ge"
        canonical="https://fixup.ge"
        type="website"
      />
      <Header />
      
      <main className="flex-grow">
        {/* Critical Hero Section - loads immediately */}
        <HeroSection />

        {/* Non-critical content - lazy loaded */}
        <Suspense fallback={
          <div className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden mb-8">
                  <div className="bg-gradient-to-r from-primary to-blue-600 p-1">
                    <div className="bg-white rounded-t-xl p-6 lg:p-8">
                      <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-64 mx-auto"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="h-12 bg-gray-200 rounded"></div>
                          <div className="h-12 bg-gray-200 rounded"></div>
                          <div className="h-12 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Quick Access Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="border-0 shadow-lg">
                      <CardContent className="p-4 lg:p-6 text-center">
                        <div className="animate-pulse">
                          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3"></div>
                          <div className="h-6 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        }>
          {/* Advanced Search Form */}
          <section className="py-8">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden mb-8">
                  <div className="bg-gradient-to-r from-primary to-blue-600 p-1">
                    <div className="bg-white rounded-t-xl p-6 lg:p-8">
                      <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="p-2 bg-gradient-to-r from-primary to-blue-600 rounded-full">
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">დეტალური ძიება</h2>
                      </div>
                      
                      <ModernServiceFilters
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
                </Card>

                {/* Quick Access Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={() => navigate("/services?onSite=true")}>
                    <CardContent className="p-4 lg:p-6 text-center">
                      <div className="p-3 lg:p-4 bg-green-500 rounded-full w-fit mx-auto mb-3 lg:mb-4 group-hover:scale-110 transition-transform">
                        <MapPin className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                      </div>
                      <h3 className="text-lg lg:text-xl font-bold text-green-900 mb-2">მისვლითი სერვისი</h3>
                      <p className="text-sm lg:text-base text-green-700">ხელოსანი თქვენთან მოვა</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={() => navigate("/services?minRating=4")}>
                    <CardContent className="p-4 lg:p-6 text-center">
                      <div className="p-3 lg:p-4 bg-blue-500 rounded-full w-fit mx-auto mb-3 lg:mb-4 group-hover:scale-110 transition-transform">
                        <Star className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                      </div>
                      <h3 className="text-lg lg:text-xl font-bold text-blue-900 mb-2">ტოპ რეიტინგი</h3>
                      <p className="text-sm lg:text-base text-blue-700">მხოლოდ 4+ ვარსკვლავი</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={() => navigate("/services")}>
                    <CardContent className="p-4 lg:p-6 text-center">
                      <div className="p-3 lg:p-4 bg-purple-500 rounded-full w-fit mx-auto mb-3 lg:mb-4 group-hover:scale-110 transition-transform">
                        <Zap className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                      </div>
                      <h3 className="text-lg lg:text-xl font-bold text-purple-900 mb-2">ყველა სერვისი</h3>
                      <p className="text-sm lg:text-base text-purple-700">სრული კატალოგი</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>
        </Suspense>

        {/* Stats Section */}
        <section className="py-12 lg:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {stats.map((stat, index) => (
                  <Card key={index} className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-4 lg:p-6 text-center">
                      <div className="flex items-center justify-center mb-3">
                        <div className="p-2 lg:p-3 bg-gradient-to-r from-primary to-blue-600 rounded-full">
                          <stat.icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                        </div>
                      </div>
                      <div className="text-xl lg:text-3xl font-bold text-gray-900 mb-1">
                        {stat.number}
                      </div>
                      <div className="text-sm lg:text-base text-gray-600 font-medium">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Service Categories - Lazy Loaded */}
        <Suspense fallback={<div className="py-12 animate-pulse"><div className="container mx-auto px-4"><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-24 bg-gray-200 rounded"></div>)}</div></div></div>}>
          <ServiceCategories categories={categories} loading={loading} />
        </Suspense>

        {/* Featured Mechanics - Lazy Loaded */}
        <Suspense fallback={<div className="py-12 animate-pulse"><div className="container mx-auto px-4"><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded"></div>)}</div></div></div>}>
          <section className="py-12 lg:py-20 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <Badge className="mb-4 bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-2">
                    <Star className="h-4 w-4 mr-2" />
                    ტოპ ხელოსნები
                  </Badge>
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">რეკომენდებული სპეციალისტები</h2>
                  <p className="text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
                    ჩვენი საუკეთესო რეიტინგის მქონე ხელოსნები, რომლებიც უზრუნველყოფენ ხარისხიან სერვისს
                  </p>
                </div>

                {mechanicsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                            <div className="space-y-2 flex-1">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : featuredMechanics.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredMechanics.map((mechanic) => (
                      <MechanicCard
                        key={mechanic.id}
                        mechanic={{
                          id: mechanic.id,
                          profiles: {
                            first_name: mechanic.profiles.first_name,
                            last_name: mechanic.profiles.last_name,
                            city: mechanic.profiles.city,
                            district: mechanic.profiles.district,
                            avatar_url: mechanic.profiles.avatar_url
                          },
                          specialization: mechanic.specialization,
                          rating: mechanic.rating,
                          review_count: mechanic.review_count
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">ფეატურებული ხელოსნები არ მოიძებნა</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </Suspense>
      </main>
      
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Index;
