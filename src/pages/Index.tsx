import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MechanicCard } from "@/components/mechanic/MechanicCard";
import { MobileSearchBar } from "@/components/mobile/MobileSearchBar";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/seo/SEOHead";
import { OrganizationSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { generateSEOTitle, generateSEODescription, generateCanonicalURL } from "@/utils/seoUtils";
import ModernServiceFilters from "@/components/services/ModernServiceFilters";
import { ServicePageNavigation } from "@/components/services/ServicePageNavigation";
import {
  Search,
  TrendingUp,
  Zap,
  Shield,
  Users,
  Star,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  UserPlus,
  Wrench,
  Car,
  DollarSign,
  FileText,
  Package,
} from "lucide-react";
import HomeCenterBanner from "@/components/banners/HomeCenterBanner";
import MobileBanner from "@/components/banners/MobileBanner";
import { OrderPartDialog } from "@/components/parts/OrderPartDialog";
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
  "თბილისი",
  "ბათუმი",
  "ქუთაისი",
  "რუსთავი",
  "გორი",
  "ზუგდიდი",
  "ფოთი",
  "ხაშური",
  "სამტრედია",
  "ოზურგეთი",
];

// პოპულარული ძიებები
const popularSearches = ["ძრავის შეკეთება", "ელექტროობა", "დიაგნოსტიკა", "ზეთის შეცვლა"];

// სტატისტიკა
const stats = [
  {
    number: "2,500+",
    label: "ხელოსანი",
    icon: Users,
  },
  {
    number: "15,000+",
    label: "სერვისი",
    icon: Zap,
  },
  {
    number: "50,000+",
    label: "მომხმარებელი",
    icon: Shield,
  },
  {
    number: "4.8★",
    label: "საშუალო რეიტინგი",
    icon: Star,
  },
];
import { useSitemapAutoUpdate } from "@/hooks/useSitemapAutoUpdate";
const Index = () => {
  // Initialize sitemap auto-update listener
  useSitemapAutoUpdate();
  const navigate = useNavigate();
  const [orderPartDialogOpen, setOrderPartDialogOpen] = useState(false);
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
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [carBrands, setCarBrands] = useState<string[]>([]);
  const [onSiteOnly, setOnSiteOnly] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch all data in parallel to reduce critical request chain
        const [categoriesResponse, mechanicsResponse, allCategoriesResponse, carBrandsResponse] = await Promise.all([
          supabase
            .from("service_categories")
            .select("*")
            .order("id", {
              ascending: true,
            })
            .limit(8),
          supabase
            .from("mechanic_profiles")
            .select(
              `
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
            `,
            )
            .gte("rating", 4.0)
            .not("rating", "is", null)
            .order("rating", {
              ascending: false,
            })
            .order("review_count", {
              ascending: false,
            })
            .limit(6),
          supabase.from("service_categories").select("*").order("name", {
            ascending: true,
          }),
          supabase.from("car_brands").select("name").order("name", { ascending: true }),
        ]);

        // Handle categories
        if (categoriesResponse.error) throw categoriesResponse.error;
        setCategories(categoriesResponse.data || []);

        // Handle all categories
        if (allCategoriesResponse.error) throw allCategoriesResponse.error;
        setAllCategories(allCategoriesResponse.data || []);

        // Handle car brands
        if (carBrandsResponse.error) throw carBrandsResponse.error;
        setCarBrands(carBrandsResponse.data?.map((b) => b.name) || []);

        // Handle mechanics
        if (mechanicsResponse.error) throw mechanicsResponse.error;
        if (mechanicsResponse.data && mechanicsResponse.data.length > 0) {
          const transformedMechanics: FeaturedMechanic[] = mechanicsResponse.data.map((mechanic) => ({
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
            "ვაკე",
            "საბურთალო",
            "ვერე",
            "გლდანი",
            "ისანი",
            "ნაძალადევი",
            "ძველი თბილისი",
            "აბანოთუბანი",
            "ავლაბარი",
            "ჩუღურეთი",
            "სამგორი",
            "დიღომი",
            "ვაშლიჯვარი",
            "მთაწმინდა",
            "კრწანისი",
            "ავჭალა",
            "ლილო",
            "ორთაჭალა",
            "დიდუბე",
            "ფონიჭალა",
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
    fetchInitialData();
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
    setSelectedBrand(null);
    setOnSiteOnly(false);
    setMinRating(null);
  };

  // All categories state (now loaded in parallel with other data)
  const [allCategories, setAllCategories] = useState<ServiceCategory[]>([]);
  const canonicalUrl = generateCanonicalURL("home", {});
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50 pb-[70px] md:pb-0">
      <SEOHead
        title={generateSEOTitle("home", {})}
        description={generateSEODescription("home", {})}
        keywords="ავტოხელოსანი, ავტოსერვისი, მექანიკოსი, ავტომობილის რემონტი, საქართველო, თბილისი, fixup"
        url={canonicalUrl}
        canonical={canonicalUrl}
        type="website"
      />

      <OrganizationSchema
        name="ავტოხელოსანი"
        url="https://fixup.ge"
        description="საქართველოს უდიდესი ავტოსერვისების პლატფორმა"
        contactPoint={{
          contactType: "customer service",
          email: "info@fixup.ge",
        }}
      />

      <BreadcrumbSchema
        items={[
          {
            name: "მთავარი",
            url: "https://fixup.ge/",
          },
        ]}
      />
      <Header />

      <main className="flex-grow">
        {/* Enhanced Search Section */}
        <section className="relative py-16 lg:py-24 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-blue-50 to-purple-50"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-200/20 to-primary/10 rounded-full blur-3xl"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
              {/* Hero Content */}
              <div className="text-center mb-12">
                <Badge className="mb-6 bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 mr-2" />
                  საქართველოს #1 ავტო-სერვისის პლატფორმა
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  იპოვეთ საუკეთესო
                  <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent block lg:inline lg:ml-4">
                    ხელოსანი
                  </span>
                </h1>
                <div className="mb-10">
                  <ServicePageNavigation />
                </div>
              </div>

              {/* Order Parts Button */}
              <div className="mb-10 flex justify-center">
                <button
                  onClick={() => setOrderPartDialogOpen(true)}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center rounded-full bg-white px-2 py-1 text-xs font-semibold text-orange-600 shadow-sm">
                      NEW
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-white">
                    <Package className="h-8 w-8" />
                    <div className="text-left">
                      <h3 className="text-xl font-bold">შეუკვეთე ნაწილი</h3>
                      <p className="text-sm opacity-90">სწრაფი და მარტივი</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Advanced Search Form */}
              <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-primary to-blue-600 p-1">
                  <div className="bg-white rounded-t-xl p-6 lg:p-8">
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <div className="p-2 bg-gradient-to-r from-primary to-blue-600 rounded-full">
                        <Search className="h-5 w-5 text-white" />
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
                      selectedBrand={selectedBrand}
                      setSelectedBrand={setSelectedBrand}
                      carBrands={carBrands}
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
                <Card
                  className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate("/services?onSite=true")}
                >
                  <CardContent className="p-4 lg:p-6 text-center">
                    <div className="p-3 lg:p-4 bg-green-500 rounded-full w-fit mx-auto mb-3 lg:mb-4 group-hover:scale-110 transition-transform">
                      <MapPin className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                    </div>
                    <h3 className="text-lg lg:text-xl font-bold text-green-900 mb-2">მისვლითი სერვისი</h3>
                    <p className="text-sm lg:text-base text-green-700">ხელოსანი თქვენთან მოვა</p>
                  </CardContent>
                </Card>

                <Card
                  className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate("/services?minRating=4")}
                >
                  <CardContent className="p-4 lg:p-6 text-center">
                    <div className="p-3 lg:p-4 bg-blue-500 rounded-full w-fit mx-auto mb-3 lg:mb-4 group-hover:scale-110 transition-transform">
                      <Star className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                    </div>
                    <h3 className="text-lg lg:text-xl font-bold text-blue-900 mb-2">ტოპ რეიტინგი</h3>
                    <p className="text-sm lg:text-base text-blue-700">მხოლოდ 4+ ვარსკვლავი</p>
                  </CardContent>
                </Card>

                <Card
                  className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate("/services")}
                >
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
                      <div className="text-xl lg:text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                      <div className="text-sm lg:text-base text-gray-600 font-medium">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Simple Registration Section */}
        <section className="py-12 lg:py-20 bg-gradient-to-br from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4 bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-2">
                <UserPlus className="h-4 w-4 mr-2" />
                გაწევრება
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">დაიწყეთ ახლავე</h2>
              <p className="text-lg lg:text-xl text-gray-600 mb-8 lg:mb-12 max-w-2xl mx-auto">
                შეუერთდით ჩვენს პლატფორმას და იღებდეთ ან გაწვდოდეთ ხარისხიანი ავტო-სერვისი
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {/* Customer Registration */}
                <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-2xl transition-all duration-300 group">
                  <CardContent className="p-6 lg:p-8 text-center">
                    <div className="p-4 lg:p-6 bg-blue-500 rounded-full w-fit mx-auto mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                      <Car className="h-8 w-8 lg:h-12 lg:w-12 text-white" />
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold text-blue-900 mb-3 lg:mb-4">მომხმარებლად</h3>
                    <p className="text-sm lg:text-base text-blue-700 mb-4 lg:mb-6">
                      იპოვეთ და დაჯავშნეთ საუკეთესო ხელოსნები თქვენი ავტომობილისთვის
                    </p>
                    <div className="space-y-3 lg:space-y-4">
                      <Link to="/register?type=customer">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 lg:py-3 text-base lg:text-lg">
                          რეგისტრაცია მომხმარებლად
                        </Button>
                      </Link>
                      <Link to="/login">
                        <Button
                          variant="outline"
                          className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 py-2 lg:py-3 text-base lg:text-lg"
                        >
                          შესვლა
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Mechanic Registration */}
                <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-2xl transition-all duration-300 group">
                  <CardContent className="p-6 lg:p-8 text-center">
                    <div className="p-4 lg:p-6 bg-orange-500 rounded-full w-fit mx-auto mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                      <Wrench className="h-8 w-8 lg:h-12 lg:w-12 text-white" />
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold text-orange-900 mb-3 lg:mb-4">ხელოსნად</h3>
                    <p className="text-sm lg:text-base text-orange-700 mb-4 lg:mb-6">
                      გაიზარდეთ თქვენი ბიზნესი და მოიძიეთ ახალი კლიენტები ჩვენს პლატფორმაზე
                    </p>
                    <div className="space-y-3 lg:space-y-4">
                      <Link to="/register?type=mechanic">
                        <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground py-2 lg:py-3 text-base lg:text-lg">
                          რეგისტრაცია ხელოსნად
                        </Button>
                      </Link>
                      <Link to="/login">
                        <Button
                          variant="outline"
                          className="w-full border-secondary text-secondary hover:bg-secondary/10 py-2 lg:py-3 text-base lg:text-lg"
                        >
                          შესვლა
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Auto Services Cards Section */}
        <section className="py-12 lg:py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <Badge className="mb-4 bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-2">
                  <Star className="h-4 w-4 mr-2" />
                  დამატებითი სერვისები
                </Badge>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">ყველა კომპანია ერთ პლატფორმაზე</h2>
                <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
                  დატოვეთ თქვენი საკონტაქტო ინფორმაცია და პარტნიორი კომპანიები პირობებს შემოგთავაზებენ!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {/* Leasing Card */}
                <Card
                  className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate("/leasing")}
                >
                  <CardContent className="p-6 lg:p-8 text-center">
                    <div className="p-4 lg:p-6 bg-green-500 rounded-full w-fit mx-auto mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                      <DollarSign className="h-8 w-8 lg:h-12 lg:w-12 text-white" />
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold text-green-900 mb-3">ავტოლიზინგები</h3>
                    <p className="text-sm lg:text-base text-green-700 mb-6">
                      მიიღეთ თქვენი საოცნებო მანქანა მოქნილი გადახდის პირობებით
                    </p>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      გაიგე მეტი
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Dealers Card */}
                <Card
                  className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate("/dealers")}
                >
                  <CardContent className="p-6 lg:p-8 text-center">
                    <div className="p-4 lg:p-6 bg-blue-500 rounded-full w-fit mx-auto mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                      <Car className="h-8 w-8 lg:h-12 lg:w-12 text-white" />
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold text-blue-900 mb-3">ავტოდილერები</h3>
                    <p className="text-sm lg:text-base text-blue-700 mb-6">
                      ოფიციალური დილერები და ფართო არჩევანი ავტომობილებისა
                    </p>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      გაიგე მეტი
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Insurance Card */}
                <Card
                  className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate("/insurance")}
                >
                  <CardContent className="p-6 lg:p-8 text-center">
                    <div className="p-4 lg:p-6 bg-purple-500 rounded-full w-fit mx-auto mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                      <Shield className="h-8 w-8 lg:h-12 lg:w-12 text-white" />
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold text-purple-900 mb-3">დაზღვევა</h3>
                    <p className="text-sm lg:text-base text-purple-700 mb-6">
                      დააზღვიეთ თქვენი ავტომობილი საუკეთესო პირობებით
                    </p>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                      გაიგე მეტი
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Our Services Section - Redesigned */}
        <section className="py-12 lg:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 lg:mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-2">
                <Zap className="h-4 w-4 mr-2" />
                ჩვენი სერვისები
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">სრული სპექტრის ავტო სერვისში</h2>
              <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
                პროფესიონალური მომსახურება ყველა ტიპის ავტომობილისთვის
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse border-0 shadow-lg bg-white">
                    <CardContent className="p-4 lg:p-6 text-center">
                      <div className="h-12 w-12 lg:h-16 lg:w-16 bg-gray-200 rounded-full mb-4 mx-auto"></div>
                      <div className="h-5 lg:h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 lg:h-4 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {categories.map((category) => (
                  <Card
                    key={category.id}
                    className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white cursor-pointer overflow-hidden"
                    onClick={() => navigate(`/services?category=${category.id}`)}
                  >
                    <CardContent className="p-4 lg:p-6 text-center relative">
                      {/* Background Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      <div className="relative z-10">
                        {/* Icon Container - Fixed */}
                        <div className="flex items-center justify-center mb-4">
                          <div className="p-3 lg:p-4 bg-gradient-to-r from-primary to-blue-600 rounded-full group-hover:scale-110 transition-transform duration-300">
                            <Wrench className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                          </div>
                        </div>

                        {/* Category Info */}
                        <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>

                        {category.description && (
                          <p className="text-xs lg:text-sm text-gray-600 line-clamp-2">{category.description}</p>
                        )}

                        {/* Hover Arrow */}
                        <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <ArrowRight className="h-4 w-4 text-primary mx-auto" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="text-center mt-8 lg:mt-12">
              <Link to="/services">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white px-6 lg:px-8 py-3 lg:py-4 text-base lg:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  ყველა სერვისის ნახვა
                  <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Banner Section - Desktop */}
        <HomeCenterBanner />

        {/* Recommended Mechanics */}
      </main>

      <Footer />
      <MobileBanner />
      <MobileBottomNav />
      <OrderPartDialog open={orderPartDialogOpen} onOpenChange={setOrderPartDialogOpen} />
    </div>
  );
};
export default Index;
