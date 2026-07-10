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
import { CAR_BRAND_LOGOS } from "@/data/carBrandLogos";
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
  const { services, loading, fetchServices } = useServices();

  // Fetch active services that serve this brand (specialists + generalists),
  // narrowed to a district when on a /brand/:slug/:district page.
  useEffect(() => {
    if (!brand) return;
    fetchServices(
      { ...emptyFilters, selectedBrands: [brand.name], selectedDistrict: districtInfo?.name ?? null },
      1,
      { all: true },
    );
  }, [brand?.name, districtInfo?.slug]);

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

  const logo = CAR_BRAND_LOGOS[brand.name];
  const locative = districtInfo ? ` ${districtInfo.nameLocative}` : "";
  const canonical = `https://fixup.ge/brand/${brand.slug}${districtInfo ? `/${districtInfo.slug}` : ""}`;
  // Index only when there is enough specialist signal — otherwise the page is
  // near-duplicate of every other brand page (all showing the "all brands" set).
  const indexable = !loading && specialists.length >= BRAND_MIN_SPECIALISTS;

  const breadcrumbItems = [
    { name: "მთავარი", url: "https://fixup.ge/" },
    { name: "მარკები", url: "https://fixup.ge/brand" },
    { name: brand.nameKa, url: `https://fixup.ge/brand/${brand.slug}` },
    ...(districtInfo ? [{ name: districtInfo.name, url: canonical }] : []),
  ];

  const title = `${brand.nameKaGen} ავტოსერვისი${locative} — ხელოსნები${districtInfo ? "" : " საქართველოში"} | FixUp`;
  const description = `${brand.nameKaGen} (${brand.name}) მანქანის შეკეთება${locative} — ${specialists.length} სპეციალისტი ხელოსანი. ფასები, შეფასებები და ონლაინ ჯავშანი FixUp-ის პლატფორმაზე.`;

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={title}
        description={description}
        canonical={canonical}
        keywords={`${brand.nameKaGen} ხელოსანი${locative}, ${brand.name} სერვისი, ${brand.nameKaGen} შეკეთება, ავტოსერვისი ${brand.nameKa}, ${brand.name} ავტოხელოსანი თბილისი`}
        noindex={!indexable}
      />
      <BreadcrumbSchema items={breadcrumbItems} />
      {specialists.length > 0 && (
        <CollectionPageSchema
          name={`${brand.nameKaGen} ავტოსერვისი${locative}`}
          description={description}
          numberOfItems={specialists.length}
          itemList={specialists.slice(0, 20).map((s) => ({
            name: s.name,
            url: `https://fixup.ge/service/${s.id}`,
            image: s.photos?.[0],
            price: s.price_from || undefined,
          }))}
        />
      )}

      <Header />

      <main className="flex-grow">
        {/* Breadcrumb */}
        <div className="bg-muted py-4">
          <div className="container mx-auto px-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">მთავარი</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/services">სერვისები</BreadcrumbLink>
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

        {/* Hero */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              {logo && (
                <img
                  src={logo}
                  alt={`${brand.nameKa} ლოგო`}
                  className="h-16 w-16 md:h-20 md:w-20 object-contain mx-auto mb-4"
                />
              )}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {brand.nameKaGen} ავტოსერვისი{locative}
                {specialists.length > 0 && (
                  <span className="block text-2xl md:text-3xl font-semibold text-primary mt-2">
                    {specialists.length} სპეციალისტი ხელოსანი
                  </span>
                )}
              </h1>
              <p className="text-lg text-muted-foreground">
                იპოვე ვერიფიცირებული ხელოსანი{districtInfo ? ` ${districtInfo.nameLocative}` : ""}, რომელიც {brand.nameKa} ({brand.name}) მანქანებზე
                სპეციალიზდება — გამჭვირვალე ფასებით, შეფასებებით და ონლაინ ჯავშნით.
              </p>
            </div>
          </div>
        </div>

        {/* Specialists — the unique, indexable listing */}
        <div className="container mx-auto px-4 py-10">
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
          <div className="container mx-auto px-4 pb-12">
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
        <section className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto prose prose-lg max-w-none">
            {districtInfo && (
              <p>
                <strong>{brand.nameKaGen} ხელოსანი {districtInfo.nameLocative}.</strong>{" "}
                იპოვე {brand.nameKa} მარკის სპეციალისტი {districtInfo.nameLocative} — უახლოესი ვერიფიცირებული
                ავტოხელოსანი შენს მახლობლად, ფასებითა და ონლაინ ჯავშნით.
              </p>
            )}
            <div dangerouslySetInnerHTML={{ __html: getBrandIntro(brand, specialists.length) }} />
          </div>
        </section>

        <CategoryFAQSection items={getBrandFAQ(brand)} categoryName={brand.nameKa} />

        {/* Brand × district internal links — deeper landing pages from the hub,
            siblings from a district page. */}
        <BrandDistrictsNav brand={brand} currentDistrictSlug={districtInfo?.slug} />

        {/* Brand switcher — internal links to the other brand pages. */}
        <BrandsNav currentSlug={brand.slug} heading="სხვა მარკები" />
      </main>

      <Footer />
    </div>
  );
};

export default BrandLanding;
