import { useCatalogueState } from "@/hooks/useCatalogueState";
import { readBrandQuery, withBrandQuery } from "@/utils/catalogueNavigation";
import { getCityByName, locationPath } from "@/utils/locationCatalogue";
import { catalogueContainerClassName } from "@/components/services/catalogueLayout";
import { getCategorySubtitle } from "@/utils/categorySubtitles";
import ServiceCatalogueHeading from "@/components/services/ServiceCatalogueHeading";
import ModernServiceFilters from "@/components/services/ModernServiceFilters";
import CategoryDistrictGuide from "@/components/seo/CategoryDistrictGuide";
import NotFound from "@/pages/NotFound";
import CategoryDecisionGuide from "@/components/seo/CategoryDecisionGuide";
import { useState, useEffect, useRef, Fragment } from "react";
import { CategoryBootShell } from "@/components/layout/CategoryBootShell";
import ServicesGridBanner from "@/components/banners/ServicesGridBanner";
import { useParams, useSearchParams, Navigate, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import ServiceCard from "@/components/services/ServiceCard";
import { supabase } from "@/integrations/supabase/client";
import { CollectionPageSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { trackSearch } from "@/utils/tracking";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { getCategoryFromSlug, createCategorySlug, createSlug } from "@/utils/slugUtils";
import { useServices, ServiceType } from "@/hooks/useServices";
import { readCategorySnapshot } from "@/lib/categorySnapshot";
import {
  getCategoryMetaTitle,
  getCategoryMetaDescription,
  getCategoryIntro,
  getCategoryHighlights,
  getCategoryTips,
  getCategoryFAQ,
  type CategoryStats,
  type FAQItem,
} from "@/utils/categoryContent";
import { CATEGORY_OVERRIDES } from "@/utils/categoryOverrides";
import { DISTRICTS, getDistrictBySlug } from "@/utils/districts";
import { CategoryIntroSection, CategoryFAQSection, RelatedCategories } from "@/components/seo/CategorySeoSections";
import { DistrictsNav } from "@/components/seo/DistrictsNav";
import { RelatedBlogPosts } from "@/components/seo/InternalLinkWidgets";

type CategoryType = {
  id: number;
  name: string;
  description: string;
  icon: string;
  seo_intro?: string | null;
  seo_faq?: FAQItem[] | null;
  seo_meta_title?: string | null;
  seo_meta_description?: string | null;
};

const ServiceCategory = () => {
  const { categoryId, categorySlug, district: districtSlug } = useParams<{
    categoryId?: string;
    categorySlug?: string;
    district?: string;
  }>();
  const [searchParams] = useSearchParams();
  const districtInfo = getDistrictBySlug(districtSlug);
  const categoryParam = categoryId || categorySlug;
  const [initialData] = useState(readCategorySnapshot);
  const [category, setCategory] = useState<CategoryType | null>(initialData?.category ?? null);
  const [resolvedCategoryParam, setResolvedCategoryParam] = useState<string | null>(initialData ? categoryParam ?? null : null);
  // Numeric routes already contain the filter ID; slug routes must resolve it first.
  const serviceCategoryId = categoryParam && /^\d+$/.test(categoryParam)
    ? Number(categoryParam)
    : resolvedCategoryParam === categoryParam ? category?.id : undefined;
  // Reuse the shared services pipeline (same as /services) so the cards render
  // identically (VIP badges/sorting included) and the fetch/transform logic
  // isn't duplicated here.
  const { services, loading: servicesLoading, fetchServices, totalCount, hasMore } = useServices(initialData);
  const [categoryLoading, setCategoryLoading] = useState(!initialData);
  const initialMetadataRefresh = useRef(!!initialData);
  const initialServicesRefresh = useRef(!!initialData);
  // The snapshot belongs only to the initial route. Once live data has arrived,
  // subsequent filtering/navigation must use the interactive loading states.
  const initialSnapshotPath = useRef(window.__fixupCategoryBoot?.snapshot
    ? window.__fixupCategoryBoot.path : null);
  const snapshotReleased = useRef(false);
  if (!categoryLoading && !servicesLoading) snapshotReleased.current = true;
  useEffect(() => {
    if (categoryLoading || servicesLoading) return;
    const boot = window.__fixupCategoryBoot;
    if (boot?.path === initialSnapshotPath.current && boot.fallbackHtml) {
      boot.html = boot.fallbackHtml;
      boot.snapshot = false;
    }
  }, [categoryLoading, servicesLoading]);
  const [filters, setFilters] = useCatalogueState({
    searchTerm: "",
    selectedCity: searchParams.get("city") || (districtInfo ? "თბილისი" : null) as string | null,
    selectedDistrict: districtInfo?.name ?? (null as string | null),
    selectedBrands: readBrandQuery(searchParams),
    onSiteOnly: false,
    minRating: null as number | null
  }, "filters");
  // Text search is decoupled from `filters` so typing doesn't auto-fetch;
  // it's applied to filters.searchTerm only on manual submit (button/Enter).
  const [searchInput, setSearchInput] = useCatalogueState("", "searchInput");

  useEffect(() => {
    let active = true;
    const background = initialMetadataRefresh.current;
    initialMetadataRefresh.current = false;
    if (!background) {
      setCategoryLoading(true);
      setCategory(null);
    }
    if (!categoryParam) {
      setCategoryLoading(false);
      return;
    }
    void (async () => {
      try {
        const data = await getCategoryFromSlug(categoryParam);
        if (!active) return;
        if (!data) {
          setCategory(null);
          throw new Error("Category not found");
        }
        setCategory(data);
        setResolvedCategoryParam(categoryParam);
      } catch (error) {
        if (!active) return;
        console.error("Error fetching category:", error);
        toast.error("კატეგორიის ჩატვირთვისას შეცდომა დაფიქსირდა");
      } finally {
        if (active) setCategoryLoading(false);
      }
    })();
    return () => { active = false; };
  }, [categoryParam]);

  useEffect(() => {
    if (serviceCategoryId !== undefined) {
      const background = initialServicesRefresh.current;
      initialServicesRefresh.current = false;
      void fetchServices({
        searchTerm: filters.searchTerm,
        selectedCategory: serviceCategoryId,
        selectedCity: filters.selectedCity,
        selectedDistrict: filters.selectedDistrict,
        selectedBrands: filters.selectedBrands,
        onSiteOnly: filters.onSiteOnly,
        minRating: filters.minRating,
      }, 0, { background });
    }
    // fetchServices is recreated on render; depend on the actual filter inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, serviceCategoryId, districtSlug, districtInfo?.name]);

  useEffect(() => {
    if (window.__fixupPrerenderCapture && category && !categoryLoading && !servicesLoading) {
      window.__fixupCategorySnapshotCapture = {
        path: window.location.pathname.replace(/\/$/, ""), category, services, totalCount, hasMore,
      };
    }
  }, [category, categoryLoading, servicesLoading, services, totalCount, hasMore]);

  if (districtSlug && !districtInfo) return <NotFound />;

  if (!snapshotReleased.current && initialSnapshotPath.current === window.location.pathname.replace(/\/$/, "")
    && (categoryLoading || (category && servicesLoading))) {
    return <CategoryBootShell />;
  }

  if (categoryLoading) {
    if (window.__fixupCategoryBoot?.path === window.location.pathname.replace(/\/$/, "")) {
      return <CategoryBootShell />;
    }
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className={`${catalogueContainerClassName} flex-grow py-8`}>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!category || (districtSlug && !districtInfo)) return <NotFound />;

  const legacyCity = getCityByName(searchParams.get('city'));
  if (legacyCity && !districtSlug && [...searchParams.keys()].every(key => key === 'city')) {
    return <Navigate replace to={locationPath(legacyCity.slug, createCategorySlug(category.name))} />;
  }

  // Breadcrumb data — district pages extend the parent crumb chain.
  const breadcrumbItems = [
    { name: 'მთავარი', url: 'https://fixup.ge/' },
    { name: 'კატეგორიები', url: 'https://fixup.ge/category' },
    { name: category.name, url: `https://fixup.ge/category/${createCategorySlug(category.name)}` },
    ...(districtInfo ? [{
      name: districtInfo.name,
      url: `https://fixup.ge/category/${createCategorySlug(category.name)}/${districtInfo.slug}`,
    }] : []),
  ];

  // SEO content — DB override OR template fallback. Price range computed from
  // the actual services in this category so the meta description reflects reality.
  const priceMin = services.reduce<number | null>(
    (m, s) => (s.price_from != null && (m == null || s.price_from < m) ? s.price_from : m),
    null
  );
  const priceMax = services.reduce<number | null>(
    (m, s) => (s.price_to != null && (m == null || s.price_to > m) ? s.price_to : m),
    null
  );
  const cities = Array.from(new Set(services.map((s) => s.city).filter(Boolean) as string[]));

  const seoStats: CategoryStats = {
    name: category.name,
    serviceCount: totalCount,
    priceMin,
    priceMax,
    cities,
  };

  // Resolution order: DB row → code override → template fallback.
  // DB row wins so editorial can hot-fix without a deploy; code overrides cover
  // high-traffic categories (Search Console top queries) before the DB is filled.
  const override = CATEGORY_OVERRIDES[category.name];
  const baseMetaTitle = getCategoryMetaTitle(seoStats, category.seo_meta_title ?? override?.seo_meta_title);
  const baseMetaDescription = getCategoryMetaDescription(seoStats, category.seo_meta_description ?? override?.seo_meta_description);
  const introHtml = getCategoryIntro(seoStats, category.seo_intro ?? override?.seo_intro);
  const highlights = getCategoryHighlights(seoStats);
  const tips = getCategoryTips(seoStats);
  const faqItems = getCategoryFAQ(seoStats, category.seo_faq ?? override?.seo_faq);

  // District-aware SEO: rewrite title/meta/H1/URL when a district slug is present.
  // The district name uses the locative case ("გლდანში") so the sentence reads
  // naturally rather than appearing as a slapped-on suffix.
  const categoryUrl = `https://fixup.ge/category/${createCategorySlug(category.name)}`;
  const canonicalUrl = districtInfo ? `${categoryUrl}/${districtInfo.slug}` : categoryUrl;
  const metaTitle = districtInfo
    ? `${category.name} ${districtInfo.nameLocative} — ${totalCount} მომსახურება | FixUp`
    : baseMetaTitle;
  const metaDescription = districtInfo
    ? `${category.name} ${districtInfo.nameLocative} — ${totalCount} მომსახურება. ფასები, შეფასებები, ჯავშანი ონლაინ. FixUp-ის პლატფორმაზე.`
    : baseMetaDescription;

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={metaTitle}
        description={metaDescription}
        keywords={districtInfo
          ? `${category.name} ${districtInfo.name}, ${category.name} ${districtInfo.nameLocative}, ავტოსერვისი ${districtInfo.name}, ხელოსანი ${districtInfo.name}, ${category.name} თბილისი`
          : `${category.name}, ავტოსერვისი, მექანიკოსი, ${category.name} ფასები, ${category.name} თბილისი, ${category.name} ბათუმი, ავტომობილის რემონტი`}
        url={canonicalUrl}
        canonical={canonicalUrl}
        noindex={searchParams.has("brands") || (!servicesLoading && totalCount === 0)}
      />

      {/* CollectionPage Schema for category */}
      <CollectionPageSchema
        name={`${category.name} სერვისები`}
        description={category.description || `იპოვეთ საუკეთესო ${category.name} სერვისები საქართველოში`}
        numberOfItems={services.length}
        itemList={services.slice(0, 20).map(service => ({
          name: service.name,
          url: `https://fixup.ge/service/${service.id}-${createSlug(service.name)}`,
          image: service.photos?.[0],
          price: service.price_from || undefined
        }))}
      />

      <BreadcrumbSchema items={breadcrumbItems} />
      
      <Header />
      
      <main className="flex-grow">
        {/* Breadcrumb */}
        <div data-category-shell="breadcrumb" className="pt-4 md:pt-8 pb-3">
          <div className={catalogueContainerClassName}>
            <Breadcrumb>
              <BreadcrumbList className="text-xs">
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">მთავარი</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/category">კატეგორიები</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {districtInfo ? <BreadcrumbLink href={`/category/${createCategorySlug(category.name)}`}>{category.name}</BreadcrumbLink> : <BreadcrumbPage>{category.name}</BreadcrumbPage>}
                </BreadcrumbItem>
                {districtInfo && <><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{districtInfo.name}</BreadcrumbPage></BreadcrumbItem></>}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        <div data-category-shell="hero" className={catalogueContainerClassName}>
          <div className="min-w-0">
            <ServiceCatalogueHeading title={`${category.name} ${districtInfo ? districtInfo.nameLocative : 'საქართველოში'}`} subtitle={getCategorySubtitle(category, districtInfo)} />
          </div>
        </div>

        <div className={`${catalogueContainerClassName} pb-3 md:pb-8`}>
          <div className="min-w-0">
          <ModernServiceFilters
            selectedCategory={category.id}
            searchTerm={searchInput}
            setSearchTerm={setSearchInput}
            selectedCity={filters.selectedCity}
            setSelectedCity={selectedCity => {
              if (districtInfo && selectedCity !== "თბილისი") {
                const query = selectedCity ? `?${new URLSearchParams({ city: selectedCity })}` : "";
                window.location.assign(`/category/${createCategorySlug(category.name)}${query}`);
              } else {
                setFilters(prev => ({ ...prev, selectedCity, selectedDistrict: selectedCity === "თბილისი" ? prev.selectedDistrict : null }));
              }
            }}
            cities={Array.from(new Set(["თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "გორი", "ზუგდიდი", "ფოთი", ...cities]))}
            selectedDistrict={filters.selectedDistrict}
            setSelectedDistrict={selectedDistrict => {
              if (districtInfo && selectedDistrict !== districtInfo.name) {
                const district = DISTRICTS.find(item => item.name === selectedDistrict);
                window.location.assign(`/category/${createCategorySlug(category.name)}${district ? `/${district.slug}` : ""}`);
              } else {
                setFilters(prev => ({ ...prev, selectedDistrict }));
              }
            }}
            districts={DISTRICTS.map(district => district.name)}
            selectedBrands={filters.selectedBrands}
            setSelectedBrands={brands => window.location.assign(withBrandQuery(window.location.pathname, brands))}
            onSiteOnly={filters.onSiteOnly}
            setOnSiteOnly={onSiteOnly => setFilters(prev => ({ ...prev, onSiteOnly }))}
            minRating={filters.minRating}
            setMinRating={minRating => setFilters(prev => ({ ...prev, minRating }))}
            onSearch={() => {
              const q = searchInput.trim();
              setFilters(prev => ({ ...prev, searchTerm: q }));
              if (q.length >= 2) trackSearch(q, "category");
            }}
            onClearSearch={() => { setSearchInput(""); setFilters(prev => ({ ...prev, searchTerm: "" })); }}
            onResetFilters={() => {
              if (searchParams.has("brands")) { window.location.assign(window.location.pathname); return; }
              setSearchInput("");
              setFilters({ searchTerm: "", selectedCity: null, selectedDistrict: districtInfo?.name ?? null, selectedBrands: [], onSiteOnly: false, minRating: null });
            }}
          />
          </div>
        </div>

        {/* Services Grid */}
        <div className={`${catalogueContainerClassName} pb-12`}>
          <p data-service-count className="mb-3 text-sm text-muted-foreground md:mb-6" aria-live="polite">
            {servicesLoading ? "იტვირთება..." : `ნაპოვნია ${totalCount} სერვისი`}
          </p>
          {servicesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {services.map((service, index) => (
                <Fragment key={service.id}>
                  <ServiceCard service={service} priorityImage={index === 0} />
                  {/* Banner after the first row (after 4th card, matches 4-col grid) */}
                  {index === 3 && <ServicesGridBanner />}
                </Fragment>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">სერვისები ვერ მოიძებნა</h3>
              <p className="text-muted-foreground mb-4">
                შეცვალეთ ფილტრები ან სცადეთ სხვა კატეგორია
              </p>
              <Link to="/services" className="text-primary hover:underline">
                ყველა სერვისის ნახვა
              </Link>
            </Card>
          )}
        </div>

        <div className={`${catalogueContainerClassName} mb-8`}>
          <details className="group rounded-2xl border bg-card [&_.container]:max-w-none [&_.container]:px-0 [&_.container]:py-5">
            <summary className="cursor-pointer px-5 py-4 text-base font-semibold text-foreground marker:text-primary md:px-6">{category.name} — ინფორმაცია და ხშირად დასმული კითხვები</summary>
            <div className="border-t px-5 pb-2 md:px-6">
        {!districtInfo && <CategoryDecisionGuide slug={createCategorySlug(category.name)} name={category.name} services={services} />}

        {/* Districts internal-link grid — Tbilisi-only, hides empty districts.
            On the parent /category/:slug page it offers 9 deeper landing pages;
            on a /category/:slug/:district page it offers the other 8 siblings. */}
        <DistrictsNav
          categoryId={category.id}
          categorySlug={createCategorySlug(category.name)}
          categoryName={category.name}
          currentDistrictSlug={districtInfo?.slug}
        />

        {/* SEO content sections — long-form copy + FAQ + internal links.
            Order: intro → FAQ → related categories → related blog posts.
            Sections render only when meaningful content exists. */}
        {districtInfo ? <CategoryDistrictGuide categoryId={category.id} categorySlug={createCategorySlug(category.name)} categoryName={category.name} district={districtInfo} /> : <>
        <CategoryIntroSection
          stats={seoStats}
          introHtml={introHtml}
          highlights={highlights}
          tips={tips}
        />

        <CategoryFAQSection items={faqItems} categoryName={category.name} />
        </>}

        <RelatedCategories currentId={category.id} limit={6} />

            </div>
          </details>
        </div>

        <RelatedBlogPosts limit={3} />
      </main>

      <Footer />
    </div>
  );
};

export default ServiceCategory;
