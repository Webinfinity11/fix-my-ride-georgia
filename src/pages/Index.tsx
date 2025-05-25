import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ServiceCategories from "@/components/home/ServiceCategories";
import HowItWorks from "@/components/home/HowItWorks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MechanicCard from "@/components/mechanic/MechanicCard";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ModernServiceFilters from "@/components/services/ModernServiceFilters";
import { 
  Search, 
  TrendingUp, 
  Zap, 
  Shield, 
  Users, 
  Star,
  MapPin,
  Clock,
  ArrowRight,
  Target,
  Award,
  CheckCircle2,
  Sparkles
} from "lucide-react";

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

// საქართველოს მთავარი ქალაქები
const georgianCities = [
  "თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "გორი",
  "ზუგდიდი", "ფოთი", "ხაშური", "სამტრედია", "ოზურგეთი"
];

// პოპულარული ძიებები
const popularSearches = [
  "ძრავის შეკეთება", "სამუხრუჭე სისტემა", "ელექტროობა", "კონდიცონერი",
  "საჭის სისტემა", "დიაგნოსტიკა", "ზეთის ცვლა", "წინა ფარები"
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
  const [cities, setCities] = useState<string[]>(georgianCities);
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
          .limit(8); // Show more categories on homepage

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

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

  const handleQuickSearch = (query: string) => {
    const params = new URLSearchParams();
    params.set("q", query);
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section - Enhanced for Search Focus */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-blue-50 to-purple-50"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-200/20 to-primary/10 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto text-center">
              {/* Main Heading */}
              <div className="mb-8">
                <Badge className="mb-6 bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 mr-2" />
                  საქართველოს #1 ავტო-სერვისის პლატფორმა
                </Badge>
                
                <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                  იპოვეთ საუკეთესო 
                  <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent block lg:inline lg:ml-4">
                    ხელოსანი
                  </span>
                </h1>
                
                <p className="text-xl lg:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto leading-relaxed">
                  ათასობით ვერიფიცირებული ხელოსანი და სერვისი ერთ ადგილას
                </p>
                
                <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
                  სწრაფი, საიმედო და ხარისხიანი ავტო-სერვისი თქვენი მანქანისთვის
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {stats.map((stat, index) => (
                  <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center mb-3">
                        <div className="p-3 bg-gradient-to-r from-primary to-blue-600 rounded-full">
                          <stat.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                        {stat.number}
                      </div>
                      <div className="text-gray-600 font-medium">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* Enhanced Search Section */}
        <section className="py-20 bg-white relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-blue-50"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
              {/* Section Header */}
              <div className="text-center mb-12">
                <Badge className="mb-4 bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-2">
                  <Target className="h-4 w-4 mr-2" />
                  ძიების ცენტრი
                </Badge>
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  მოძებნეთ სასურველი 
                  <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent"> სერვისი</span>
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  გამოიყენეთ ჩვენი მოწინავე ძიების სისტემა სწრაფი და ზუსტი შედეგებისთვის
                </p>
              </div>

              {/* Popular Searches */}
              <div className="mb-12">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-gray-700">პოპულარული ძიებები</span>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {popularSearches.map((search) => (
                    <Button
                      key={search}
                      variant="outline"
                      onClick={() => handleQuickSearch(search)}
                      className="rounded-full border-2 border-primary/20 hover:border-primary hover:bg-primary hover:text-white transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      {search}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Advanced Search Form */}
              <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-blue-600 p-1">
                  <div className="bg-white rounded-t-xl p-8">
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <div className="p-2 bg-gradient-to-r from-primary to-blue-600 rounded-full">
                        <Search className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">დეტალური ძიება</h3>
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
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={() => navigate("/services-detail?onSite=true")}>
                  <CardContent className="p-6 text-center">
                    <div className="p-4 bg-green-500 rounded-full w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <MapPin className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-green-900 mb-2">მისვლითი სერვისი</h3>
                    <p className="text-green-700">ხელოსანი თქვენთან მოვა</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={() => navigate("/services-detail?minRating=4")}>
                  <CardContent className="p-6 text-center">
                    <div className="p-4 bg-blue-500 rounded-full w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Star className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-blue-900 mb-2">ტოპ რეიტინგი</h3>
                    <p className="text-blue-700">მხოლოდ 4+ ვარსკვლავი</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={() => navigate("/services-detail")}>
                  <CardContent className="p-6 text-center">
                    <div className="p-4 bg-purple-500 rounded-full w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-purple-900 mb-2">ყველა სერვისი</h3>
                    <p className="text-purple-700">სრული კატალოგი</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        
        {/* Services Categories */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-2">
                <Award className="h-4 w-4 mr-2" />
                სერვისის კატეგორიები
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">ჩვენი სერვისები</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                აღმოაჩინეთ ჩვენი მრავალფეროვანი სერვისები ავტომობილებისთვის
              </p>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <ServiceCategories categories={categories} />
            )}
            
            <div className="text-center mt-12">
              <Link to="/services-detail">
                <Button size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  ყველა სერვისის ნახვა
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <HowItWorks />

        {/* Featured Mechanics */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-2">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                ვერიფიცირებული ხელოსნები
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">რეკომენდირებული ხელოსნები</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                გაეცანით ჩვენს საუკეთესო ხელოსნებს, რომლებიც გამოირჩევიან მაღალი პროფესიონალიზმით
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
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
              <Link to="/search?tab=mechanics">
                <Button size="lg" variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  ყველა ხელოსნის ნახვა
                  <ArrowRight className="h-5 w-5 ml-2" />
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