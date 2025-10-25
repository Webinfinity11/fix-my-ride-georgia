import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ServiceCard from "@/components/services/ServiceCard";
import ServiceCardSkeleton from "@/components/services/ServiceCardSkeleton";
import ModernServiceFilters from "@/components/services/ModernServiceFilters";
import { useServices } from "@/hooks/useServices";
import { Filter, RefreshCw, MapPin } from "lucide-react";

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
  const navigate = useNavigate();
  const [visibleServicesCount, setVisibleServicesCount] = useState(12);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(true);
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

  // Memoized values
  const hasActiveFilters = useMemo(
    () =>
      searchTerm ||
      selectedCategory !== "all" ||
      selectedCity ||
      selectedDistrict ||
      selectedBrands.length > 0 ||
      onSiteOnly ||
      minRating,
    [searchTerm, selectedCategory, selectedCity, selectedDistrict, selectedBrands, onSiteOnly, minRating]
  );

  const availableCities = useMemo(() => cities.length > 0 ? cities : georgianCities, [cities]);
  const availableDistricts = useMemo(
    () => selectedCity === "თბილისი" ? (districts.length > 0 ? districts : tbilisiDistricts) : [],
    [selectedCity, districts]
  );

  const sortedServices = useMemo(() => {
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
  }, [services, sortBy]);

  // Callbacks
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (selectedCategory !== "all") params.set("category", selectedCategory.toString());
    if (selectedCity) params.set("city", selectedCity);
    if (selectedDistrict) params.set("district", selectedDistrict);
    if (selectedBrands.length > 0) params.set("brands", selectedBrands.join(","));
    if (onSiteOnly) params.set("onSite", "true");
    if (minRating) params.set("minRating", minRating.toString());
    setSearchParams(params);
  }, [searchTerm, selectedCategory, selectedCity, selectedDistrict, selectedBrands, onSiteOnly, minRating, setSearchParams]);

  const canSearch = useMemo(() => categories.length > 0, [categories.length]);

  const performSearch = useCallback(async () => {
    if (!canSearch) return;
    
    const filters = {
      searchTerm: searchTerm.trim(),
      selectedCategory,
      selectedCity,
      selectedDistrict,
      selectedBrands,
      onSiteOnly,
      minRating,
    };
    await fetchServices(filters);
    updateURL();
  }, [canSearch, searchTerm, selectedCategory, selectedCity, selectedDistrict, selectedBrands, onSiteOnly, minRating, fetchServices, updateURL]);

  const handleResetFilters = useCallback(async () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedCity(null);
    setSelectedDistrict(null);
    setSelectedBrands([]);
    setOnSiteOnly(false);
    setMinRating(null);
    setSearchParams({});
  }, [setSearchParams]);

  const handleSearch = useCallback(async () => {
    await performSearch();
  }, [performSearch]);

  const loadMoreServices = useCallback(() => {
    setVisibleServicesCount((prev) => prev + 12);
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Handle districts when city changes
  useEffect(() => {
    if (selectedCity === "თბილისი") {
      fetchDistricts(selectedCity);
    } else {
      setSelectedDistrict(null);
    }
  }, [selectedCity, fetchDistricts]);

  // Trigger search when filters change (with debouncing for searchTerm)
  useEffect(() => {
    if (categories.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      performSearch();
    }, searchTerm ? 500 : 100);
    
    return () => clearTimeout(timeoutId);
  }, [
    searchTerm, 
    selectedCategory, 
    selectedCity, 
    selectedDistrict, 
    selectedBrands.join(','),
    onSiteOnly, 
    minRating,
    performSearch
  ]);

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">ავტო სერვისი</h1>
              <h2 className="text-lg text-gray-600">მოძებნეთ სასურველი ხელოსანი და ავტო სერვისი</h2>
            </div>

            {/* Filters Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-primary/20"
                  >
                    <Filter className="h-4 w-4" />
                    ფილტრები
                  </Button>
                  <Button
                    onClick={() => navigate("/map")}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
                  >
                    <MapPin className="h-4 w-4" />
                    რუკით ძებნა
                  </Button>
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

            {/* Choose a Craftsman Promotional Box */}
            <div
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200 mb-8 cursor-pointer hover:shadow-xl transition-all duration-300"
              onClick={() => (window.location.href = "tel:+995574047994")}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">🔧 მირჩიე ხელოსანი</h3>
                  <p className="text-gray-600">დაგვირეკეთ და ჩვენ შეგირჩევთ შესაფერის ხელოსანს</p>
                  <p className="text-lg font-semibold text-primary mt-1">+995 574 04 79 94</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = "tel:+995574047994";
                  }}
                  className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors duration-200 flex items-center gap-2 shrink-0"
                >
                  📞 დარეკვა
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
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {sortedServices.slice(0, visibleServicesCount).map((service) => (
                    <ServiceCard key={service.id} service={service} />
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
  );
};
export default ServicesDetail;