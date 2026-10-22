import { useCatalogueState } from "@/hooks/useCatalogueState";
import { RelatedBlogPosts } from "@/components/seo/InternalLinkWidgets";
import { cataloguePath } from "@/utils/catalogueNavigation";
import { useSearchParams } from "react-router-dom";
import ModernServiceFilters from "@/components/services/ModernServiceFilters";
import ServiceCatalogueHeading from "@/components/services/ServiceCatalogueHeading";
import { catalogueContainerClassName } from "@/components/services/catalogueLayout";
import { CITIES, getCityByName } from "@/utils/locationCatalogue";
import { DISTRICTS } from "@/utils/districts";
import { createSlug } from "@/utils/slugUtils";
import { ModelLinks } from '@/components/seo/ModelLinks';
import { useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import ServiceCard from "@/components/services/ServiceCard";
import { Card } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { BreadcrumbSchema, CollectionPageSchema } from "@/components/seo/StructuredData";
import { BrandsNav } from "@/components/seo/BrandsNav";
import { BrandDistrictsNav } from "@/components/seo/BrandDistrictsNav";
import { CategoryFAQSection } from "@/components/seo/CategorySeoSections";
import { getBrandBySlug, isSpecialist, BRAND_MIN_SPECIALISTS } from "@/utils/carBrands";
import { getDistrictBySlug } from "@/utils/districts";
import { getBrandIntro, getBrandFAQ } from "@/utils/brandContent";
import { useServices } from "@/hooks/useServices";
import NotFound from "@/pages/NotFound";

const emptyFilters = {
  searchTerm: "",
  selectedCategory: "all" as const,
  selectedCity: null as string | null,
  selectedDistrict: null as string | null,
  selectedBrands: [] as string[],
  onSiteOnly: false,
  minRating: null as number | null,
};

const BrandLanding = () => {
  const { brandSlug, district: districtSlug } = useParams<{ brandSlug: string; district?: string }>();
  const brand = getBrandBySlug(brandSlug);
  const districtInfo = getDistrictBySlug(districtSlug);
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useCatalogueState('', "searchInput");
  const [filters, setFilters] = useCatalogueState({ ...emptyFilters, selectedCity: searchParams.get('city') }, "filters");
  const selectedCity = getCityByName(filters.selectedCity);
  const { services, loading, fetchServices } = useServices();

  // Fetch active services that serve this brand (specialists + generalists),
  // narrowed to a district when on a /brand/:slug/:district page.
  useEffect(() => {
    if (!brand) return;
    fetchServices(
      { ...filters, selectedBrands: [brand.name], selectedDistrict: districtInfo?.name ?? filters.selectedDistrict },
      0,
      { all: true },
    );
  }, [brand?.name, districtInfo?.slug, filters]);

  // Split specialists (focused mechanics) from generalists (the "all brands"
  // crowd). Specialists are the page's unique, indexable content.
  const { specialists, generalists } = useMemo(() => {
    const spec = services.filter((s) => isSpecialist(s.car_brands));
    const gen = services.filter((s) => !isSpecialist(s.car_brands));
    return { specialists: spec, generalists: gen };
  }, [services]);

  if (!brand) return <NotFound />;
  // A district segment that doesn't resolve would render hub content at a
  // deeper URL (duplicate) — 404 instead.
  if (districtSlug && !districtInfo) return <NotFound />;

  const locative = districtInfo ? ` ${districtInfo.nameLocative}` : selectedCity ? ` ${selectedCity.locative}` : "";
  const canonical = `https://fixup.ge/brand/${brand.slug}${districtInfo ? `/${districtInfo.slug}` : ""}`;
  // Index only when there is enough specialist signal — otherwise the page is
  // near-duplicate of every other brand page (all showing the "all brands" set).
  const indexable = loading || specialists.length >= BRAND_MIN_SPECIALISTS;
  const providerCount = new Set(specialists.map(s => s.mechanic.id).filter(Boolean)).size;

  const breadcrumbItems = [
    { name: "მთავარი", url: "https://fixup.ge/" },
    { name: "მარკები", url: "https://fixup.ge/brand" },
    { name: brand.nameKa, url: `https://fixup.ge/brand/${brand.slug}` },
    ...(districtInfo ? [{ name: districtInfo.name, url: canonical }] : []),
  ];

  const title = `${brand.nameKaGen} ავტოსერვისი${locative} — ხელოსნები${districtInfo ? "" : " საქართველოში"} | FixUp`;
  const description = `${brand.nameKaGen} (${brand.name}) მანქანის შეკეთება${locative} — ${specialists.length} შესაბამისი მომსახურება, ${providerCount} მიმწოდებელი. ფასები, შეფასებები და ონლაინ ჯავშანი FixUp-ის პლატფორმაზე.`;

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={title}
        description={description}
        canonical={canonical}
        keywords={`${brand.nameKaGen} ხელოსანი${locative}, ${brand.name} სერვისი, ${brand.nameKaGen} შეკეთება, ავტოსერვისი ${brand.nameKa}, ${brand.name} ავტოხელოსანი თბილისი`}
        noindex={!indexable || Boolean(filters.selectedCity)}
      />
      <BreadcrumbSchema items={breadcrumbItems} />
      {specialists.length > 0 && (
        <CollectionPageSchema
          name={`${brand.nameKaGen} ავტოსერვისი${locative}`}
          description={description}
          numberOfItems={specialists.length}
          itemList={specialists.slice(0, 20).map((s) => ({
            name: s.name,
            url: `https://fixup.ge/service/${s.id}-${createSlug(s.name)}`,
            image: s.photos?.[0],
            price: s.price_from || undefined,
          }))}
        />
      )}

      <Header />

      <main className="flex-grow">
        {/* Breadcrumb */}
        <div className="pt-4 md:pt-8 pb-3">
          <div className={catalogueContainerClassName}>
            <Breadcrumb>
              <BreadcrumbList className="text-xs">
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">მთავარი</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/brand">მარკები</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {districtInfo ? (
                    <BreadcrumbLink href={`/brand/${brand.slug}`}>{brand.nameKa}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{brand.nameKa}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {districtInfo && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{districtInfo.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        <div className={catalogueContainerClassName}>
          <ServiceCatalogueHeading title={`${brand.nameKaGen} ავტოსერვისი${locative}`} subtitle={`იპოვეთ ${brand.nameKa} (${brand.name}) მარკის ხელოსანი${locative} — შეადარეთ მომსახურებები, მითითებული ფასები და მისამართები.`} />
          <ModernServiceFilters selectedCategory="all" searchTerm={searchInput} setSearchTerm={setSearchInput}
            selectedCity={filters.selectedCity} setSelectedCity={selectedCity => setFilters(prev => ({ ...prev, selectedCity, selectedDistrict: selectedCity === 'თბილისი' ? prev.selectedDistrict : null }))}
            cities={CITIES.map(city => city.name)} selectedDistrict={districtInfo?.name ?? filters.selectedDistrict}
            setSelectedDistrict={selectedDistrict => {
              if (districtInfo) { const next=DISTRICTS.find(item=>item.name===selectedDistrict);window.location.assign(`/brand/${brand.slug}${next ? `/${next.slug}` : ''}`); }
              else setFilters(prev=>({...prev,selectedDistrict}));
            }} districts={DISTRICTS.map(item=>item.name)} selectedBrands={[brand.name]} setSelectedBrands={brands => window.location.assign(cataloguePath({ citySlug: selectedCity?.slug, brands }))}
            onSiteOnly={filters.onSiteOnly} setOnSiteOnly={onSiteOnly=>setFilters(prev=>({...prev,onSiteOnly}))}
            minRating={filters.minRating} setMinRating={minRating=>setFilters(prev=>({...prev,minRating}))}
            onSearch={()=>setFilters(prev=>({...prev,searchTerm:searchInput.trim()}))}
            onClearSearch={()=>{setSearchInput('');setFilters(prev=>({...prev,searchTerm:''}));}}
            onResetFilters={()=>window.location.assign("/services")}
          />
        </div>

        {/* Specialists — the unique, indexable listing */}
        <div className={`${catalogueContainerClassName} py-6`}>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            {brand.nameKaGen} სპეციალისტები{locative}
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : specialists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {specialists.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">
                {brand.nameKaGen} სპეციალისტი ხელოსანი ჯერ არ არის
              </h3>
              <p className="text-muted-foreground mb-4">
                იხილეთ ყველა ხელოსანი, ვინც ამ მარკას ემსახურება, ქვემოთ — ან დაათვალიერეთ სხვა მარკები.
              </p>
              <Link to="/services" className="text-primary hover:underline">
                ყველა სერვისის ნახვა
              </Link>
            </Card>
          )}
        </div>

        {/* Generalists — mechanics who serve this brand among many others. Kept
            secondary so the page's primary content stays brand-specific. */}
        {generalists.length > 0 && (
          <div className={`${catalogueContainerClassName} pb-12`}>
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              ასევე ემსახურება {brand.nameKa} მარკას
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {generalists.slice(0, 12).map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        )}

        {/* Brand-specific SEO copy — unique per brand so the cluster reads as
            distinct pages, not a name-swapped template. On a district page a
            district-specific lead keeps it distinct from the brand hub too. */}
        <div className={`${catalogueContainerClassName} my-8`}>
          <details className="rounded-2xl border bg-card [&_.container]:max-w-none [&_.container]:px-0 [&_.container]:py-5">
            <summary className="cursor-pointer px-5 py-4 text-base font-semibold text-foreground marker:text-primary md:px-6">
              {brand.nameKaGen} მომსახურება — ინფორმაცია და ხშირად დასმული კითხვები
            </summary>
            <div className="border-t px-5 pb-2 md:px-6">
            <div className="prose prose-lg max-w-none py-5">
            {districtInfo && (
              <p>
                <strong>{brand.nameKaGen} ხელოსანი {districtInfo.nameLocative}.</strong>{" "}
                იპოვე {brand.nameKa} მარკის სპეციალისტი {districtInfo.nameLocative} — შესაბამისი
                ავტოხელოსანი შენს მახლობლად, ფასებითა და ონლაინ ჯავშნით.
              </p>
            )}
            <div dangerouslySetInnerHTML={{ __html: getBrandIntro(brand, specialists.length) }} />
            </div>

        <CategoryFAQSection items={getBrandFAQ(brand)} categoryName={brand.nameKa} />

        {/* Brand × district internal links — deeper landing pages from the hub,
            siblings from a district page. */}
        <ModelLinks brand={brand} />
        <BrandDistrictsNav brand={brand} currentDistrictSlug={districtInfo?.slug} />

        {/* Brand switcher — internal links to the other brand pages. */}
        <BrandsNav currentSlug={brand.slug} heading="სხვა მარკები" />
            </div>
          </details>
        </div>

        <RelatedBlogPosts limit={3} />
      </main>

      <Footer />
    </div>
  );
};

export default BrandLanding;
