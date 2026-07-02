import { useState, useEffect, Fragment } from "react";
import ServicesGridBanner from "@/components/banners/ServicesGridBanner";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import ServiceCard from "@/components/services/ServiceCard";
import { supabase } from "@/integrations/supabase/client";
import { CollectionPageSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search as SearchIcon, X } from "lucide-react";
import { trackSearch } from "@/utils/tracking";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { getCategoryFromSlug, createCategorySlug, createSlug } from "@/utils/slugUtils";
import { useServices, ServiceType } from "@/hooks/useServices";
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
  const districtInfo = getDistrictBySlug(districtSlug);
  const [category, setCategory] = useState<CategoryType | null>(null);
  // Reuse the shared services pipeline (same as /services) so the cards render
  // identically (VIP badges/sorting included) and the fetch/transform logic
  // isn't duplicated here.
  const { services, loading: servicesLoading, fetchServices } = useServices();
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [filters, setFilters] = useState({
    searchTerm: "",
    selectedCity: null as string | null,
    selectedDistrict: districtInfo?.name ?? (null as string | null),
    selectedBrands: [] as string[],
    onSiteOnly: false,
    minRating: null as number | null
  });
  // Text search is decoupled from `filters` so typing doesn't auto-fetch;
  // it's applied to filters.searchTerm only on manual submit (button/Enter).
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const param = categoryId || categorySlug;
    if (param) {
      fetchCategoryAndServices();
    }
  }, [categoryId, categorySlug]);

  useEffect(() => {
    if (category) {
      fetchServices({
        searchTerm: filters.searchTerm,
        selectedCategory: category.id,
        selectedCity: filters.selectedCity,
        selectedDistrict: filters.selectedDistrict,
        selectedBrands: filters.selectedBrands,
        onSiteOnly: filters.onSiteOnly,
        minRating: filters.minRating,
      });
    }
  }, [filters, category]);

  const fetchCategoryAndServices = async () => {
    const param = categoryId || categorySlug;
    if (!param) return;

    try {
      setCategoryLoading(true);
      console.log("🔍 Looking for category with param:", param);
      
      // Use slug utility to get category (supports both ID and slug)
      const categoryData = await getCategoryFromSlug(param);
      
      if (!categoryData) {
        console.error("❌ Category not found for param:", param);
        throw new Error('Category not found');
      }
      
      console.log("✅ Category found:", categoryData);
      setCategory(categoryData);

    } catch (error: any) {
      console.error("Error fetching category:", error);
      toast.error("კატეგორიის ჩატვირთვისას შეცდომა დაფიქსირდა");
    } finally {
      setCategoryLoading(false);
    }
  };

  if (categoryLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
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

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 text-center">
          <div role="alert" className="text-2xl font-bold mb-4">კატეგორია ვერ მოიძებნა</div>
          <Link to="/services" className="text-primary hover:underline">
            უკან სერვისებზე
          </Link>
        </main>
        <Footer />
      </div>
    );
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
    serviceCount: services.length,
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
    ? `${category.name} ${districtInfo.nameLocative} — ${services.length} ხელოსანი | FixUp`
    : baseMetaTitle;
  const metaDescription = districtInfo
    ? `${category.name} ${districtInfo.nameLocative} — ${services.length} ვერიფიცირებული ხელოსანი. ფასები, შეფასებები, ჯავშანი ონლაინ. FixUp-ის პლატფორმაზე.`
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
        <div className="bg-muted py-4">
          <div className="container mx-auto px-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">მთავარი</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/category">კატეგორიები</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{category.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Header Section — keyword-rich H1 with city + count, plus subtitle */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {category.name} {districtInfo ? districtInfo.nameLocative : 'თბილისში'}
                {services.length > 0 && (
                  <span className="block text-2xl md:text-3xl font-semibold text-primary mt-2">
                    {services.length} ვერიფიცირებული ხელოსანი
                  </span>
                )}
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                {districtInfo
                  ? `${category.name} ${districtInfo.nameLocative} — იპოვეთ უახლოესი ხელოსანი თქვენი მახლობლად, წინასწარი ჯავშნით და გამჭვირვალე ფასებით.`
                  : category.description || `იპოვეთ საუკეთესო ${category.name}-ის ხელოსანი თბილისში, ბათუმში, ქუთაისში და მთელ საქართველოში — გამჭვირვალე ფასებით და რეალური შეფასებებით.`}
              </p>
              <div className="text-sm text-muted-foreground">
                {services.length} სერვისი ამ კატეგორიაში
              </div>
            </div>
          </div>
        </div>

        {/* Simple filters for category page */}
        <div className="container mx-auto px-4 py-6">
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">ძებნა</Label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const q = searchInput.trim();
                    setFilters(prev => ({ ...prev, searchTerm: q }));
                    if (q.length >= 2) trackSearch(q, "category");
                  }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <Input
                      id="search"
                      placeholder="ძებნა სერვისებში..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className={searchInput ? "pr-9" : ""}
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={() => { setSearchInput(""); setFilters(prev => ({ ...prev, searchTerm: "" })); }}
                        aria-label="ძიების გასუფთავება"
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button type="submit" size="icon" className="shrink-0" aria-label="ძებნა">
                    <SearchIcon className="h-4 w-4" />
                  </Button>
                </form>
              </div>
              <div>
                <Label htmlFor="city">ქალაქი</Label>
                <Select value={filters.selectedCity || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, selectedCity: value === "all" ? null : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="აირჩიეთ ქალაქი" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ყველა ქალაქი</SelectItem>
                    <SelectItem value="თბილისი">თბილისი</SelectItem>
                    <SelectItem value="ბათუმი">ბათუმი</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="onsite"
                  checked={filters.onSiteOnly}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, onSiteOnly: checked as boolean }))}
                />
                <Label htmlFor="onsite">მხოლოდ ადგილზე სერვისი</Label>
              </div>
            </div>
          </Card>
        </div>

        {/* Services Grid */}
        <div className="container mx-auto px-4 pb-12">
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
                  <ServiceCard service={service} />
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
        <CategoryIntroSection
          stats={seoStats}
          introHtml={introHtml}
          highlights={highlights}
          tips={tips}
        />

        <CategoryFAQSection items={faqItems} categoryName={category.name} />

        <RelatedCategories currentId={category.id} limit={6} />

        <RelatedBlogPosts limit={3} />
      </main>

      <Footer />
    </div>
  );
};

export default ServiceCategory;