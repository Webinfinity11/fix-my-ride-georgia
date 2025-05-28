
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MechanicCard } from "@/components/mechanic/MechanicCard";
import MechanicCardSkeleton from "@/components/mechanic/MechanicCardSkeleton";
import MechanicFilters from "@/components/mechanic/MechanicFilters";
import { useMechanics } from "@/hooks/useMechanics";
import { Filter, RefreshCw } from "lucide-react";

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

const Mechanics = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [visibleMechanicsCount, setVisibleMechanicsCount] = useState(12);
  const [showFilters, setShowFilters] = useState(true);
  
  const {
    mechanics,
    cities,
    districts,
    loading,
    fetchInitialData,
    fetchDistricts,
    fetchMechanics,
  } = useMechanics();

  // Filter states - initialized from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [selectedCity, setSelectedCity] = useState<string | null>(
    searchParams.get("city") || null
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(
    searchParams.get("district") || null
  );
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(
    searchParams.get("specialization") || null
  );
  const [mobileServiceOnly, setMobileServiceOnly] = useState(
    searchParams.get("mobile") === "true"
  );
  const [minRating, setMinRating] = useState<number | null>(
    searchParams.get("minRating") ? parseInt(searchParams.get("minRating")!) : null
  );
  const [verifiedOnly, setVerifiedOnly] = useState(
    searchParams.get("verified") === "true"
  );

  console.log("🏁 Mechanics component mounted");
  console.log("🔧 Initial filter states:", {
    searchTerm,
    selectedCity,
    selectedDistrict,
    selectedSpecialization,
    mobileServiceOnly,
    minRating,
    verifiedOnly
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
      selectedCity,
      selectedDistrict,
      selectedSpecialization,
      mobileServiceOnly,
      minRating,
      verifiedOnly
    });
    
    if (cities.length > 0 || searchTerm || selectedCity || selectedDistrict || selectedSpecialization || mobileServiceOnly || minRating || verifiedOnly) {
      console.log("✅ Data loaded or filters applied, performing search");
      performSearch();
    } else {
      console.log("⏳ Waiting for data to load...");
    }
  }, [searchTerm, selectedCity, selectedDistrict, selectedSpecialization, mobileServiceOnly, minRating, verifiedOnly, cities]);

  const performSearch = async () => {
    console.log("🔍 Performing search with current filters");
    
    const filters = {
      searchTerm: searchTerm.trim(),
      selectedCity,
      selectedDistrict,
      selectedSpecialization,
      mobileServiceOnly,
      minRating,
      verifiedOnly,
    };
    
    console.log("📋 Search filters:", filters);
    await fetchMechanics(filters);
    updateURL();
  };

  const updateURL = () => {
    console.log("🔗 Updating URL with current filters");
    const params = new URLSearchParams();
    
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (selectedCity) params.set("city", selectedCity);
    if (selectedDistrict) params.set("district", selectedDistrict);
    if (selectedSpecialization) params.set("specialization", selectedSpecialization);
    if (mobileServiceOnly) params.set("mobile", "true");
    if (minRating) params.set("minRating", minRating.toString());
    if (verifiedOnly) params.set("verified", "true");
    
    console.log("🔗 New URL params:", params.toString());
    setSearchParams(params);
  };

  const handleResetFilters = async () => {
    console.log("🧹 Resetting all filters");
    
    setSearchTerm("");
    setSelectedCity(null);
    setSelectedDistrict(null);
    setSelectedSpecialization(null);
    setMobileServiceOnly(false);
    setMinRating(null);
    setVerifiedOnly(false);
    setSearchParams({});
    
    console.log("✅ Filters reset, search will trigger via useEffect");
  };

  const handleSearch = async () => {
    console.log("🚀 Manual search button clicked");
    await performSearch();
  };

  const loadMoreMechanics = () => {
    console.log("📄 Loading more mechanics");
    setVisibleMechanicsCount(prev => prev + 12);
  };

  const hasActiveFilters = searchTerm || 
    selectedCity || 
    selectedDistrict || 
    selectedSpecialization || 
    mobileServiceOnly || 
    minRating || 
    verifiedOnly;

  const availableCities = cities.length > 0 ? cities : georgianCities;
  const availableDistricts = selectedCity === "თბილისი" 
    ? (districts.length > 0 ? districts : tbilisiDistricts)
    : [];

  console.log("📈 Render stats:", {
    mechanicsCount: mechanics.length,
    loading,
    hasActiveFilters,
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">ყველა ხელოსანი</h1>
              <p className="text-lg text-gray-600">მოძებნეთ სასურველი ხელოსანი</p>
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
                </div>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
                  <MechanicFilters
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedCity={selectedCity}
                    setSelectedCity={setSelectedCity}
                    cities={availableCities}
                    selectedDistrict={selectedDistrict}
                    setSelectedDistrict={setSelectedDistrict}
                    districts={availableDistricts}
                    selectedSpecialization={selectedSpecialization}
                    setSelectedSpecialization={setSelectedSpecialization}
                    mobileServiceOnly={mobileServiceOnly}
                    setMobileServiceOnly={setMobileServiceOnly}
                    minRating={minRating}
                    setMinRating={setMinRating}
                    verifiedOnly={verifiedOnly}
                    setVerifiedOnly={setVerifiedOnly}
                    onSearch={handleSearch}
                    onResetFilters={handleResetFilters}
                  />
                </div>
              )}
            </div>
            
            {/* Results Section */}
            {loading ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <MechanicCardSkeleton key={i} />
                ))}
              </div>
            ) : mechanics.length > 0 ? (
              <div>
                {/* Results Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <p className="text-gray-600">
                      ნაპოვნია <span className="font-semibold text-primary">{mechanics.length}</span> ხელოსანი
                    </p>
                    {hasActiveFilters && (
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        ფილტრებით
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Mechanics Grid */}
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {mechanics.slice(0, visibleMechanicsCount).map(mechanic => (
                    <MechanicCard 
                      key={mechanic.id} 
                      mechanic={mechanic}
                    />
                  ))}
                </div>

                {/* Load More Button */}
                {mechanics.length > visibleMechanicsCount && (
                  <div className="mt-12 text-center">
                    <Button
                      onClick={loadMoreMechanics}
                      variant="outline"
                      size="lg"
                      className="px-8 py-3 rounded-xl border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors bg-white/80 backdrop-blur-sm"
                    >
                      მეტის ჩვენება ({mechanics.length - visibleMechanicsCount} დარჩენილი)
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">ხელოსნები ვერ მოიძებნა</h3>
                  <p className="text-gray-600 mb-6">
                    {hasActiveFilters 
                      ? "შეცვალეთ საძიებო კრიტერიუმები ან გაასუფთავეთ ფილტრები" 
                      : "ჯერ არ არის დამატებული ხელოსნები"
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

export default Mechanics;
