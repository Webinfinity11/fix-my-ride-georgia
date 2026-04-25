import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ServiceCard from "@/components/services/ServiceCard";
import ServiceCardSkeleton from "@/components/services/ServiceCardSkeleton";
import ModernServiceFilters from "@/components/services/ModernServiceFilters";
import ServicesGridBanner from "@/components/banners/ServicesGridBanner";
import ServicesPageBanner from "@/components/banners/ServicesPageBanner";
import { useServices } from "@/hooks/useServices";
import { RefreshCw } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";

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

// თბილისის უბნები
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
type SortOption = "newest" | "oldest" | "price_low" | "price_high" | "rating" | "popular";
const ServicesDetail = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [visibleServicesCount, setVisibleServicesCount] = useState(12);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const { services, categories, cities, districts, loading, fetchInitialData, fetchDistricts, fetchServices } =
    useServices();

  // Filter states - initialized from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">(
    searchParams.get("category") ? parseInt(searchParams.get("category")!) : "all",
  );
  const [selectedCity, setSelectedCity] = useState<string | null>(searchParams.get("city") || null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(searchParams.get("district") || null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    searchParams.get("brands") ? searchParams.get("brands")!.split(",") : [],
  );
  const [onSiteOnly, setOnSiteOnly] = useState(searchParams.get("onSite") === "true");
  const [minRating, setMinRating] = useState<number | null>(
    searchParams.get("minRating") ? parseInt(searchParams.get("minRating")!) : null,
  );
  console.log("🏁 ServicesDetail component mounted");
  console.log("🔧 Initial filter states:", {
    searchTerm,
    selectedCategory,
    selectedCity,
    selectedDistrict,
    selectedBrands,
    onSiteOnly,
    minRating,
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
      minRating,
    });
    if (categories.length > 0) {
      // Wait for initial data to load
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
    setVisibleServicesCount((prev) => prev + 12);
  };
  const hasActiveFilters =
    searchTerm ||
    selectedCategory !== "all" ||
    selectedCity ||
    selectedDistrict ||
    selectedBrands.length > 0 ||
    onSiteOnly ||
    minRating;
  const sortedServices = sortServices(services);
  const availableCities = cities.length > 0 ? cities : georgianCities;
  const availableDistricts = selectedCity === "თბილისი" ? (districts.length > 0 ? districts : tbilisiDistricts) : [];
  console.log("📈 Render stats:", {
    servicesCount: services.length,
    sortedServicesCount: sortedServices.length,
    loading,
    hasActiveFilters,
    categoriesCount: categories.length,
    citiesCount: availableCities.length,
  });
  return (
    <>
    <Layout>
      <div className="py-4 md:py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-3 md:mb-8">
              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-1">ავტო სერვისი</h1>
              <h2 className="text-sm md:text-lg text-muted-foreground">მოძებნეთ სასურველი ხელოსანი და ავტო სერვისი</h2>
            </div>

            {/* Filters Section */}
            <div className="mb-3 md:mb-8">
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

            {/* Choose a Craftsman Promotional Box */}
            <div
              className="bg-card/80 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-md md:shadow-lg p-3 md:p-6 border border-border mb-4 md:mb-8 cursor-pointer hover:shadow-xl transition-all duration-300"
              onClick={() => (window.location.href = "tel:+995574047994")}
            >
              <div className="flex flex-row items-center justify-between gap-3 md:gap-4">
                <div className="min-w-0">
                  <h3 className="text-base md:text-xl font-bold text-foreground mb-0.5 md:mb-2">🔧 მირჩიე ხელოსანი</h3>
                  <p className="text-xs md:text-base text-muted-foreground hidden md:block">დაგვირეკეთ და ჩვენ შეგირჩევთ შესაფერის ხელოსანს</p>
                  <p className="text-sm md:text-lg font-semibold text-primary mt-0.5 md:mt-1">+995 574 04 79 94</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = "tel:+995574047994";
                  }}
                  className="bg-primary text-primary-foreground px-4 py-2 md:px-6 md:py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-primary/90 transition-colors duration-200 flex items-center gap-2 shrink-0"
                >
                  📞 <span className="hidden md:inline">დარეკვა</span>
                </button>
              </div>
            </div>

            {/* Results Section */}
            {loading ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <ServiceCardSkeleton key={i} />
                ))}
              </div>
            ) : sortedServices.length > 0 ? (
              <div>
                {/* Results Header */}
                <div className="flex items-center justify-between mb-3 md:mb-6">
                  <div className="flex items-center gap-3">
                    <p className="text-muted-foreground">
                      ნაპოვნია <span className="font-semibold text-primary">{sortedServices.length}</span> სერვისი
                    </p>
                    {hasActiveFilters && (
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        ფილტრებით
                      </Badge>
                    )}
                  </div>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                    <SelectTrigger className="w-[180px] h-9 text-sm border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">ახალი → ძველი</SelectItem>
                      <SelectItem value="oldest">ძველი → ახალი</SelectItem>
                      <SelectItem value="rating">რეიტინგით</SelectItem>
                      <SelectItem value="popular">პოპულარობით</SelectItem>
                      <SelectItem value="price_low">ფასი: დაბალი → მაღალი</SelectItem>
                      <SelectItem value="price_high">ფასი: მაღალი → დაბალი</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Services Grid */}
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {sortedServices.slice(0, visibleServicesCount).map((service, index) => (
                    <>
                      <ServiceCard key={service.id} service={service} />
                      {/* Banner after first row (after 4th item for 4-column grid) */}
                      {index === 3 && <ServicesGridBanner key="banner-row-1" />}
                    </>
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
                  <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-4xl">🔍</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">სერვისები ვერ მოიძებნა</h3>
                  <p className="text-muted-foreground mb-6">
                    {hasActiveFilters
                      ? "შეცვალეთ საძიებო კრიტერიუმები ან გაასუფთავეთ ფილტრები"
                      : "ჯერ არ არის დამატებული სერვისები"}
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
      </div>
    </Layout>
    <ServicesPageBanner />
    </>
  );
};
export default ServicesDetail;
