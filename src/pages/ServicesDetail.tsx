
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ServiceCard from "@/components/services/ServiceCard";
import ServiceCardSkeleton from "@/components/services/ServiceCardSkeleton";
import ModernServiceFilters from "@/components/services/ModernServiceFilters";
import { useServices } from "@/hooks/useServices";
import { Filter, Grid, List, RefreshCw } from "lucide-react";

// საქართველოს მთავარი ქალაქები
const georgianCities = [
  "თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "გორი",
  "ზუგდიდი", "ფოთი", "ხაშური", "სამტრედია", "ოზურგეთი"
];

// თბილისის უბნები
const tbilisiDistricts = [
  "ვაკე", "საბურთალო", "ვერე", "გლდანი", "ისანი", "ნაძალადევი",
  "ძველი თბილისი", "აბანოთუბანი", "ავლაბარი", "ჩუღურეთი", "სამგორი",
  "დიღომი", "ვაშლიჯვარი", "მთაწმინდა", "კრწანისი", "ავჭალა",
  "ლილო", "ორთაჭალა", "დიდუბე", "ფონიჭალა"
];

type SortOption = "newest" | "oldest" | "price_low" | "price_high" | "rating" | "popular";

const ServicesDetail = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [visibleServicesCount, setVisibleServicesCount] = useState(12);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(true);
  
  const {
    services,
    categories,
    cities,
    districts,
    loading,
    fetchInitialData,
    fetchDistricts,
    fetchServices,
  } = useServices();

  // Filter states - initialized from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">(
    searchParams.get("category") ? parseInt(searchParams.get("category")!) : "all"
  );
  const [selectedCity, setSelectedCity] = useState<string | null>(
    searchParams.get("city") || null
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(
    searchParams.get("district") || null
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    searchParams.get("brands") ? searchParams.get("brands")!.split(",") : []
  );
  const [onSiteOnly, setOnSiteOnly] = useState(
    searchParams.get("onSite") === "true"
  );
  const [minRating, setMinRating] = useState<number | null>(
    searchParams.get("minRating") ? parseInt(searchParams.get("minRating")!) : null
  );

  console.log("🏁 ServicesDetail component mounted");
  console.log("🔧 Initial filter states:", {
    searchTerm,
    selectedCategory,
    selectedCity,
    selectedDistrict,
    selectedBrands,
    onSiteOnly,
    minRating
  });

  // Initialize data on component mount
  useEffect(() => {
    console.log("🚀 Initializing component data...");
    const initializeData = async () => {
      await fetchInitialData();
    };
    initializeData();
  }, []);

  // Handle districts when city changes
  useEffect(() => {
    console.log("🏙️ City changed to:", selectedCity);
    if (selectedCity === "თბილისი") {
      fetchDistricts(selectedCity);
    } else {
      console.log("🧹 Clearing districts (city is not თბილისი)");
      setSelectedDistrict(null);
    }
  }, [selectedCity, fetchDistricts]);

  // Trigger search when any filter changes
  useEffect(() => {
    console.log("🔄 Filters changed, triggering search...");
    console.log("📊 Current filter values:", {
      searchTerm,
      selectedCategory,
      selectedCity,
      selectedDistrict,
      selectedBrands,
      onSiteOnly,
      minRating
    });
    
    if (categories.length > 0) { // Wait for initial data to load
      console.log("✅ Categories loaded, performing search");
      performSearch();
    } else {
      console.log("⏳ Waiting for categories to load...");
    }
  }, [searchTerm, selectedCategory, selectedCity, selectedDistrict, selectedBrands, onSiteOnly, minRating, categories]);

  const performSearch = async () => {
    console.log("🔍 Performing search with current filters");
    
    const filters = {
      searchTerm: searchTerm.trim(),
      selectedCategory,
      selectedCity,
      selectedDistrict,
      selectedBrands,
      onSiteOnly,
      minRating,
    };
    
    console.log("📋 Search filters:", filters);
    await fetchServices(filters);
    updateURL();
  };

  const updateURL = () => {
    console.log("🔗 Updating URL with current filters");
    const params = new URLSearchParams();
    
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (selectedCategory !== "all") params.set("category", selectedCategory.toString());
    if (selectedCity) params.set("city", selectedCity);
    if (selectedDistrict) params.set("district", selectedDistrict);
    if (selectedBrands.length > 0) params.set("brands", selectedBrands.join(","));
    if (onSiteOnly) params.set("onSite", "true");
    if (minRating) params.set("minRating", minRating.toString());
    
    console.log("🔗 New URL params:", params.toString());
    setSearchParams(params);
  };

  const handleResetFilters = async () => {
    console.log("🧹 Resetting all filters");
    
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedCity(null);
    setSelectedDistrict(null);
    setSelectedBrands([]);
    setOnSiteOnly(false);
    setMinRating(null);
    setSearchParams({});
    
    console.log("✅ Filters reset, search will trigger via useEffect");
  };

  const handleSearch = async () => {
    console.log("🚀 Manual search button clicked");
    await performSearch();
  };

  const sortServices = (services: any[]) => {
    console.log("📊 Sorting services by:", sortBy);
    return [...services].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "oldest":
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case "price_low":
          const aPrice = a.price_from || a.price_to || 0;
          const bPrice = b.price_from || b.price_to || 0;
          return aPrice - bPrice;
        case "price_high":
          const aPriceHigh = a.price_to || a.price_from || 0;
          const bPriceHigh = b.price_to || b.price_from || 0;
          return bPriceHigh - aPriceHigh;
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "popular":
          return (b.review_count || 0) - (a.review_count || 0);
        default:
          return 0;
      }
    });
  };

  const loadMoreServices = () => {
    console.log("📄 Loading more services");
    setVisibleServicesCount(prev => prev + 12);
  };

  const hasActiveFilters = searchTerm || 
    selectedCategory !== "all" || 
    selectedCity || 
    selectedDistrict || 
    selectedBrands.length > 0 || 
    onSiteOnly || 
    minRating;

  const sortedServices = sortServices(services);
  const availableCities = cities.length > 0 ? cities : georgianCities;
  const availableDistricts = selectedCity === "თბილისი" 
    ? (districts.length > 0 ? districts : tbilisiDistricts)
    : [];

  console.log("📈 Render stats:", {
    servicesCount: services.length,
    sortedServicesCount: sortedServices.length,
    loading,
    hasActiveFilters,
    categoriesCount: categories.length,
    citiesCount: availableCities.length
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />
      
      <main className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">ყველა სერვისი</h1>
              <p className="text-lg text-gray-600">მოძებნეთ სასურველი ხელოსანი და სერვისი</p>
            </div>
            
            {/* Filters Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-primary/20"
                >
                  <Filter className="h-4 w-4" />
                  ფილტრები
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2">
                      აქტიური
                    </Badge>
                  )}
                </Button>

                <div className="flex items-center gap-4">
                  {/* Reset Filters */}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      onClick={handleResetFilters}
                      className="text-gray-500 hover:text-red-500"
                      size="sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      გასუფთავება
                    </Button>
                  )}

                  {/* Sort Options */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-3 py-2 border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="newest">ახალი</option>
                    <option value="oldest">ძველი</option>
                    <option value="price_low">ფასი ↑</option>
                    <option value="price_high">ფასი ↓</option>
                    <option value="rating">რეიტინგი</option>
                    <option value="popular">პოპულარული</option>
                  </select>

                  {/* View Mode Toggle */}
                  <div className="flex border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-r-none"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
                  <ModernServiceFilters
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    categories={categories}
                    selectedCity={selectedCity}
                    setSelectedCity={setSelectedCity}
                    cities={availableCities}
                    selectedDistrict={selectedDistrict}
                    setSelectedDistrict={setSelectedDistrict}
                    districts={availableDistricts}
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
              )}
            </div>
            
            {/* Results Section */}
            {loading ? (
              <div className={`grid gap-6 ${
                viewMode === "grid" 
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                  : "grid-cols-1"
              }`}>
                {[...Array(8)].map((_, i) => (
                  <ServiceCardSkeleton key={i} />
                ))}
              </div>
            ) : sortedServices.length > 0 ? (
              <div>
                {/* Results Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <p className="text-gray-600">
                      ნაპოვნია <span className="font-semibold text-primary">{sortedServices.length}</span> სერვისი
                    </p>
                    {hasActiveFilters && (
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        ფილტრებით
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Services Grid */}
                <div className={`grid gap-6 ${
                  viewMode === "grid" 
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                    : "grid-cols-1"
                }`}>
                  {sortedServices.slice(0, visibleServicesCount).map(service => (
                    <ServiceCard 
                      key={service.id} 
                      service={service}
                    />
                  ))}
                </div>

                {/* Load More Button */}
                {sortedServices.length > visibleServicesCount && (
                  <div className="mt-12 text-center">
                    <Button
                      onClick={loadMoreServices}
                      variant="outline"
                      size="lg"
                      className="px-8 py-3 rounded-xl border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors bg-white/80 backdrop-blur-sm"
                    >
                      მეტის ჩვენება ({sortedServices.length - visibleServicesCount} დარჩენილი)
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-4xl">🔍</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">სერვისები ვერ მოიძებნა</h3>
                  <p className="text-gray-600 mb-6">
                    {hasActiveFilters 
                      ? "შეცვალეთ საძიებო კრიტერიუმები ან გაასუფთავეთ ფილტრები" 
                      : "ჯერ არ არის დამატებული სერვისები"
                    }
                  </p>
                  {hasActiveFilters && (
                    <Button onClick={handleResetFilters} variant="outline">
                      ფილტრების გასუფთავება
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ServicesDetail;
