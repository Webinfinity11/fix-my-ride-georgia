import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import ServiceCard from "@/components/services/ServiceCard";
import ServiceCardSkeleton from "@/components/services/ServiceCardSkeleton";
import ModernServiceFilters from "@/components/services/ModernServiceFilters";
import { useServices } from "@/hooks/useServices";

const ServicesDetail = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [visibleServicesCount, setVisibleServicesCount] = useState(12);
  
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

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [onSiteOnly, setOnSiteOnly] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);

  // Initialize filters from URL parameters
  useEffect(() => {
    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const city = searchParams.get("city");
    const district = searchParams.get("district");
    const brands = searchParams.get("brands");
    const onSite = searchParams.get("onSite");
    const rating = searchParams.get("minRating");

    if (q) setSearchTerm(q);
    if (category) setSelectedCategory(parseInt(category));
    if (city) setSelectedCity(city);
    if (district) setSelectedDistrict(district);
    if (brands) setSelectedBrands(brands.split(","));
    if (onSite === "true") setOnSiteOnly(true);
    if (rating) setMinRating(parseInt(rating));
  }, [searchParams]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCity === "თბილისი") {
      fetchDistricts(selectedCity);
    } else {
      setSelectedDistrict(null);
    }
  }, [selectedCity]);

  useEffect(() => {
    fetchServices({
      searchTerm,
      selectedCategory,
      selectedCity,
      selectedDistrict,
      selectedBrands,
      onSiteOnly,
      minRating,
    });
  }, [searchTerm, selectedCategory, selectedCity, selectedDistrict, selectedBrands, onSiteOnly, minRating]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (searchTerm) params.set("q", searchTerm);
    if (selectedCategory !== "all") params.set("category", selectedCategory.toString());
    if (selectedCity) params.set("city", selectedCity);
    if (selectedDistrict) params.set("district", selectedDistrict);
    if (selectedBrands.length > 0) params.set("brands", selectedBrands.join(","));
    if (onSiteOnly) params.set("onSite", "true");
    if (minRating) params.set("minRating", minRating.toString());
    
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedCity(null);
    setSelectedDistrict(null);
    setSelectedBrands([]);
    setOnSiteOnly(false);
    setMinRating(null);
    setSearchParams({});
  };

  const loadMoreServices = () => {
    setVisibleServicesCount(prev => prev + 12);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">ყველა სერვისი</h1>
              <p className="text-lg text-gray-600">მოძებნეთ სასურველი ხელოსანი და სერვისი</p>
            </div>
            
            <ModernServiceFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
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
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <ServiceCardSkeleton key={i} />
                ))}
              </div>
            ) : services.length > 0 ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-600">
                    ნაპოვნია <span className="font-semibold text-primary">{services.length}</span> სერვისი
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {services.slice(0, visibleServicesCount).map(service => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>

                {services.length > visibleServicesCount && (
                  <div className="mt-12 text-center">
                    <Button
                      onClick={loadMoreServices}
                      variant="outline"
                      size="lg"
                      className="px-8 py-3 rounded-xl border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      მეტის ჩვენება ({services.length - visibleServicesCount} დარჩენილი)
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
                  <p className="text-gray-600 mb-6">შეცვალეთ საძიებო კრიტერიუმები ან გაასუფთავეთ ფილტრები</p>
                  <Button onClick={handleResetFilters} variant="outline">
                    ფილტრების გასუფთავება
                  </Button>
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
