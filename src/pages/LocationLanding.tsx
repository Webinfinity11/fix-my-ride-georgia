import { useCatalogueState, useCatalogueResume } from "@/hooks/useCatalogueState";
import { cataloguePath, readBrandQuery } from "@/utils/catalogueNavigation";
import { Fragment, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/seo/SEOHead';
import { BreadcrumbSchema, CollectionPageSchema } from '@/components/seo/StructuredData';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import ModernServiceFilters from '@/components/services/ModernServiceFilters';
import ServiceCatalogueHeading from '@/components/services/ServiceCatalogueHeading';
import ServiceCard from '@/components/services/ServiceCard';
import ServiceCardSkeleton from '@/components/services/ServiceCardSkeleton';
import { catalogueContainerClassName } from '@/components/services/catalogueLayout';
import { useServices } from '@/hooks/useServices';
import { getPublicServiceCategories, publicCategoriesKey } from '@/lib/serviceMetadata';
import { locationCatalogueOptions } from '@/lib/locationCatalogue';
import { CITIES, getCityByName, getCityBySlug, locationIndexable, locationPath } from '@/utils/locationCatalogue';
import { createCategorySlug, createSlug } from '@/utils/slugUtils';
import { getCategorySubtitle } from '@/utils/categorySubtitles';
import { DISTRICTS } from '@/utils/districts';
import NotFound from '@/pages/NotFound';

export default function LocationLanding() {
  const { citySlug, categorySlug } = useParams();
  const city = getCityBySlug(citySlug);
  const resumeCatalogue = useCatalogueResume();
  const [searchParams] = useSearchParams();
  const { data: categories, isPending: categoriesPending, isError: categoriesError } = useQuery({ queryKey: [...publicCategoriesKey, 'location'], queryFn: getPublicServiceCategories });
  const { data: inventory, isPending: inventoryPending, isError: inventoryError } = useQuery(locationCatalogueOptions);
  const category = categories?.find(item => createCategorySlug(item.name) === categorySlug);
  const { services, loading, loadingMore, totalCount, hasMore, fetchServices, fetchInitialData, cities } = useServices();
  const [searchInput, setSearchInput] = useCatalogueState('', "searchInput");
  const [page, setPage] = useCatalogueState(0, "page");
  const [filters, setFilters] = useCatalogueState({ searchTerm: '', selectedDistrict: null as string | null, selectedBrands: readBrandQuery(searchParams), onSiteOnly: false, minRating: null as number | null }, "filters");
  useEffect(() => {
    void fetchInitialData();
    // Public metadata is cached independently of listing filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!city || (categorySlug && !category)) return;
    if (resumeCatalogue.current) { resumeCatalogue.current = false; return; }
    setPage(0);
    void fetchServices({ ...filters, selectedCity: city.name, selectedCategory: category?.id ?? 'all' }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city?.name, categorySlug, category?.id, filters]);
  if (!city || (categorySlug && !categoriesPending && !categoriesError && !category)) return <NotFound />;
  const categoryPending = Boolean(categorySlug && categoriesPending);
  const baseRows = (inventory || []).filter(row => row.city?.trim() === city.name);
  const matching = category ? baseRows.filter(row => row.category_id === category.id) : baseRows;
  const providerCount = new Set(matching.map(row => row.mechanic_id).filter(Boolean)).size;
  const indexable = !inventoryError && !categoriesError && !inventoryPending && !categoryPending && locationIndexable(matching.length, providerCount);
  const path = locationPath(city.slug, categorySlug);
  const canonical = `https://fixup.ge${path}`;
  const title = category ? `${category.name} ${city.locative}` : `ავტოსერვისები ${city.locative}`;
  const subtitle = category ? getCategorySubtitle(category) : `${city.name} — მოძებნეთ ავტოხელოსანი მომსახურების კატეგორიის მიხედვით, შეადარეთ მითითებული ფასები და მისამართები.`;
  const description = `${title}. ${matching.length} აქტიური სერვისი, ${providerCount} მიმწოდებელი. ${category ? getCategorySubtitle(category) : 'კატეგორიები, ხელოსნების მისამართები და მითითებული ფასები FixUp-ზე.'}`;
  const breadcrumbs = [
    { name: 'მთავარი', url: 'https://fixup.ge/' },
    { name: 'სერვისები', url: 'https://fixup.ge/services' },
    { name: city.name, url: `https://fixup.ge/city/${city.slug}` },
    ...(category ? [{ name: category.name, url: canonical }] : []),
  ];
  const counts = new Map<number, number>();
  for (const row of baseRows) if (row.category_id != null) counts.set(row.category_id, (counts.get(row.category_id) || 0) + 1);
  const localCategories = (categories || []).filter(item => counts.has(item.id)).sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0));
  const reset = () => window.location.assign(categorySlug ? `/category/${categorySlug}` : "/services");
  return (
    <Layout>
      <SEOHead title={`${title} — ხელოსნები და მომსახურება | FixUp`} description={description} url={canonical} canonical={canonical} noindex={!indexable || searchParams.has("brands")} />
      <BreadcrumbSchema items={breadcrumbs} />
      <CollectionPageSchema name={title} description={description} numberOfItems={totalCount} itemList={services.slice(0,20).map(service => ({ name: service.name, url: `https://fixup.ge/service/${service.id}-${createSlug(service.name)}`, image: service.photos?.[0], price: service.price_from || undefined }))} />
      <div data-location-ready={!loading && !categoryPending && !inventoryPending && !inventoryError && !categoriesError} className={`${catalogueContainerClassName} py-4 md:py-8`}>
        <Breadcrumb className="mb-3"><BreadcrumbList className="text-xs">{breadcrumbs.map((item, index) => <Fragment key={item.url}>{index > 0 && <BreadcrumbSeparator />}<BreadcrumbItem>{index === breadcrumbs.length - 1 ? <BreadcrumbPage>{item.name}</BreadcrumbPage> : <BreadcrumbLink href={new URL(item.url).pathname}>{item.name}</BreadcrumbLink>}</BreadcrumbItem></Fragment>)}</BreadcrumbList></Breadcrumb>
        <ServiceCatalogueHeading title={title} subtitle={subtitle} />
        {categoriesError || inventoryError ? <p role="alert" className="mb-4 text-destructive">მონაცემები ვერ ჩაიტვირთა. გთხოვთ, განაახლოთ გვერდი.</p> : null}
        <ModernServiceFilters searchTerm={searchInput} setSearchTerm={setSearchInput} selectedCategory={category?.id ?? 'all'} selectedCity={city.name} setSelectedCity={name => { const next=getCityByName(name);window.location.assign(cataloguePath({ categorySlug, citySlug: next?.slug, brands: filters.selectedBrands })); }} cities={cities.length ? cities : CITIES.map(item => item.name)} selectedDistrict={filters.selectedDistrict} setSelectedDistrict={selectedDistrict => setFilters(prev => ({ ...prev, selectedDistrict }))} districts={DISTRICTS.map(item => item.name)} selectedBrands={filters.selectedBrands} setSelectedBrands={brands => window.location.assign(cataloguePath({ categorySlug, citySlug, brands }))} onSiteOnly={filters.onSiteOnly} setOnSiteOnly={onSiteOnly => setFilters(prev => ({ ...prev, onSiteOnly }))} minRating={filters.minRating} setMinRating={minRating => setFilters(prev => ({ ...prev, minRating }))} onSearch={() => setFilters(prev => ({ ...prev, searchTerm: searchInput.trim() }))} onClearSearch={() => { setSearchInput(''); setFilters(prev => ({ ...prev, searchTerm: '' })); }} onResetFilters={reset} />
        <p className="my-5 text-sm text-muted-foreground" aria-live="polite">{loading || categoryPending ? 'იტვირთება...' : `ნაპოვნია ${totalCount} სერვისი`}</p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading || categoryPending ? Array.from({length:4}, (_, i) => <ServiceCardSkeleton key={i} />) : services.map((service,i) => <ServiceCard key={service.id} service={service} priorityImage={i===0} />)}
        </div>
        {!loading && !categoryPending && !services.length && <p className="rounded-xl border p-8 text-center">ამ პირობებით სერვისი ვერ მოიძებნა. შეცვალეთ ფილტრები ან აირჩიეთ სხვა კატეგორია.</p>}
        {hasMore && <div className="mt-6 text-center"><Button variant="outline" disabled={loadingMore} onClick={() => { const next=page+1;setPage(next);void fetchServices({...filters,selectedCity:city.name,selectedCategory:category?.id ?? 'all'},next); }}>{loadingMore ? 'იტვირთება...' : 'მეტის ჩვენება'}</Button></div>}
        <details className="mt-8 rounded-2xl border bg-card p-5">
          <summary className="cursor-pointer text-base font-semibold marker:text-primary">{title} — კატეგორიები და ხელოსნები</summary>
          <div className="mt-4 space-y-4 border-t pt-4">
          <p className="text-sm text-muted-foreground">{inventoryPending ? 'მონაცემები იტვირთება.' : `${city.locative} ამ განყოფილებაში ${matching.length} აქტიური მომსახურება და ${providerCount} განსხვავებული მიმწოდებელია.`} განცხადებებში შეამოწმეთ მისამართი, სამუშაოს აღწერა და ფასი. ვიზიტამდე დაუკავშირდით ხელოსანს მომსახურების პირობებისა და თავისუფალი დროის დასაზუსტებლად.</p>
          {category && <a className="inline-block text-sm text-primary hover:underline" href={`/category/${createCategorySlug(category.name)}`}>{category.name} — ყველა ქალაქში</a>}
          <div className="flex flex-wrap gap-2">{localCategories.map(item => <a key={item.id} href={locationPath(city.slug,createCategorySlug(item.name))} className="rounded-lg border px-3 py-2 text-sm hover:border-primary">{item.name} · {counts.get(item.id)}</a>)}</div>
          <a className="inline-block text-sm text-primary hover:underline" href={category ? locationPath(city.slug) : '/services'}>{category ? `${city.name} — ყველა ავტოსერვისი` : 'ყველა სერვისი საქართველოში'}</a>
          </div>
        </details>
      </div>
    </Layout>
  );
}
