
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MechanicCard } from "@/components/mechanic/MechanicCard";
import MechanicCardSkeleton from "@/components/mechanic/MechanicCardSkeleton";
import MechanicFilters from "@/components/mechanic/MechanicFilters";
import { useMechanics } from "@/hooks/useMechanics";
import { trackSearch } from "@/utils/tracking";
import { Filter, RefreshCw, MapPin } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";
import { StaticPageSeoBlock } from "@/components/seo/StaticPageSeoBlock";
import { MECHANICS_CONTENT } from "@/utils/staticPagesSeoContent";

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
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(true);

  const {
    mechanics,
    cities,
    districts,
    loading,
    loadingMore,
    hasMore,
    fetchInitialData,
    fetchDistricts,
    fetchMechanics,
  } = useMechanics();

  // Filters used by the last executed search — "load more" reuses these.
  const lastFiltersRef = useRef({
    searchTerm: "",
    selectedCity: null as string | null,
    selectedDistrict: null as string | null,
    selectedSpecialization: null as string | null,
    mobileServiceOnly: false,
    minRating: null as number | null,
    verifiedOnly: false,
  });

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

  // Initialize data on component mount
  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle districts when city changes.
  // NOTE: fetchDistricts is intentionally NOT a dependency — it's re-created on
  // every render (not memoized), and depending on it caused an infinite loop
  // (fetch → setDistricts(new array) → re-render → fetch …) whenever თბილისი
  // was selected. Depend only on selectedCity.
  useEffect(() => {
    if (selectedCity === "თბილისი") {
      fetchDistricts(selectedCity);
    } else {
      setSelectedDistrict(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity]);

  // Trigger search (page 0) when any filter changes.
  useEffect(() => {
    performSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, selectedDistrict, selectedSpecialization, mobileServiceOnly, minRating, verifiedOnly]);

  const buildFilters = () => ({
    searchTerm: searchTerm.trim(),
    selectedCity,
    selectedDistrict,
    selectedSpecialization,
    mobileServiceOnly,
    minRating,
    verifiedOnly,
  });

  const performSearch = async () => {
    const filters = buildFilters();
    lastFiltersRef.current = filters; // remember for "load more"
    setPage(0);
    await fetchMechanics(filters, 0);
    updateURL();
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (selectedCity) params.set("city", selectedCity);
    if (selectedDistrict) params.set("district", selectedDistrict);
    if (selectedSpecialization) params.set("specialization", selectedSpecialization);
    if (mobileServiceOnly) params.set("mobile", "true");
    if (minRating) params.set("minRating", minRating.toString());
    if (verifiedOnly) params.set("verified", "true");
    setSearchParams(params);
  };

  const handleResetFilters = async () => {
    setSearchTerm("");
    setSelectedCity(null);
    setSelectedDistrict(null);
    setSelectedSpecialization(null);
    setMobileServiceOnly(false);
    setMinRating(null);
    setVerifiedOnly(false);
    setSearchParams({});

    const empty = {
      searchTerm: "",
      selectedCity: null,
      selectedDistrict: null,
      selectedSpecialization: null,
      mobileServiceOnly: false,
      minRating: null,
      verifiedOnly: false,
    };
    lastFiltersRef.current = empty;
    setPage(0);
    await fetchMechanics(empty, 0);
  };

  const handleSearch = async () => {
    if (searchTerm.trim()) trackSearch(searchTerm, "mechanics");
    await performSearch();
  };

  const loadMoreMechanics = () => {
    const next = page + 1;
    setPage(next);
    // Reuse the exact filters from the last executed search (not the live input).
    fetchMechanics(lastFiltersRef.current, next);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <SEOHead
        title="ხელოსნები — ავტოხელოსანი"
        description="იპოვეთ საუკეთესო ხელოსანი საქართველოში. 200+ დადასტურებული ავტოხელოსანი, რეიტინგები, შეფასებები და კონტაქტი."
        keywords="ხელოსანი, ავტოხელოსანი, მექანიკოსი, თბილისი, ბათუმი, ქუთაისი, საქართველო"
        url="https://fixup.ge/mechanic"
        canonical="https://fixup.ge/mechanic"
      />
      <BreadcrumbSchema items={[
        { name: "მთავარი", url: "https://fixup.ge/" },
        { name: "ხელოსნები", url: "https://fixup.ge/mechanic" },
      ]} />
      <Header />
      
      <main className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">ავტოხელოსნები საქართველოში</h1>
              <p className="text-lg text-gray-600">ვერიფიცირებული მექანიკოსები თბილისში, ბათუმში, ქუთაისში — შეფასებებითა და გამოცდილებით</p>
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
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2">
                        აქტიური
                      </Badge>
                    )}
                  </Button>
                  <Button
                    onClick={() => navigate("/map")}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
                  >
                    <MapPin className="h-4 w-4" />
                    რუკით ძებნა
                  </Button>
                </div>

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
                  {mechanics.map(mechanic => (
                    <MechanicCard
                      key={mechanic.id}
                      mechanic={mechanic}
                    />
                  ))}
                </div>

                {/* Load More Button — server-paginated (or client-revealed while searching) */}
                {hasMore && (
                  <div className="mt-12 text-center">
                    <Button
                      onClick={loadMoreMechanics}
                      disabled={loadingMore}
                      variant="outline"
                      size="lg"
                      className="px-8 py-3 rounded-xl border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors bg-white/80 backdrop-blur-sm"
                    >
                      {loadingMore ? "იტვირთება..." : "მეტის ჩვენება"}
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

        {/* Long-form SEO content — intro + highlights + tips + FAQ + related blogs */}
        <StaticPageSeoBlock
          introHeading={MECHANICS_CONTENT.introHeading}
          introHtml={MECHANICS_CONTENT.introHtml}
          highlights={MECHANICS_CONTENT.highlights}
          highlightsHeading={MECHANICS_CONTENT.highlightsHeading}
          tips={MECHANICS_CONTENT.tips}
          tipsHeading={MECHANICS_CONTENT.tipsHeading}
          faqItems={MECHANICS_CONTENT.faqItems}
          faqHeading={MECHANICS_CONTENT.faqHeading}
          topicName={MECHANICS_CONTENT.topicName}
        />
      </main>

      <Footer />
    </div>
  );
};

export default Mechanics;
