import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SEOHead from '@/components/seo/SEOHead';
import { BreadcrumbSchema, CollectionPageSchema } from '@/components/seo/StructuredData';
import ServiceCard from '@/components/services/ServiceCard';
import NotFound from '@/pages/NotFound';
import { useServices } from '@/hooks/useServices';
import { getBrandBySlug } from '@/utils/carBrands';
import { getDistrictBySlug } from '@/utils/districts';
import { getPublicServiceCategories } from '@/lib/serviceMetadata';
import { createCategorySlug, createServiceSlug } from '@/utils/slugUtils';
import { modelPath, modelsForBrand, modelSlug as toModelSlug } from '@/utils/serviceModels';
import { ModelLinks } from '@/components/seo/ModelLinks';
export default function ModelLanding() {
  const { brandSlug, modelSlug, categorySlug, district } = useParams();
  const brand = getBrandBySlug(brandSlug);
  const districtInfo = getDistrictBySlug(district);
  const { services, loading, fetchServices } = useServices();
  const { data: categories, isLoading: categoriesLoading, isError, refetch } = useQuery({queryKey:['model-page-categories'],queryFn:getPublicServiceCategories});
  const category = categories?.find(c => createCategorySlug(c.name) === categorySlug);
  const validModel = Boolean(modelSlug && /^[a-z0-9]{1,64}$/.test(modelSlug));
  useEffect(() => {
    if (!brand || !validModel || (categorySlug && !category) || (district && !districtInfo)) return;
    fetchServices({ searchTerm:'', selectedCategory:category?.id || 'all', selectedCity:null,
      selectedDistrict:districtInfo?.name || null, selectedBrands:[brand.name], selectedModel:{brand:brand.name,slug:modelSlug!},
      onSiteOnly:false,minRating:null },0,{all:true});
  },[brand?.name,modelSlug,category?.id,categorySlug,districtInfo?.slug]);
  if (!brand || !validModel || (district && !districtInfo) || (categorySlug && !categoriesLoading && !category && !isError)) return <NotFound />;
  const catalogModel = modelsForBrand(brand.name).find(m => toModelSlug(m.model) === modelSlug);
  const model = services.flatMap(s => s.vehicle_models || []).find(m => m.brand===brand.name && m.slug===modelSlug)?.model || catalogModel?.model || modelSlug!;
  const label = `${brand.nameKa} ${model}`;
  const heading = `${label} — ${category?.name || 'ხელოსანი და ავტოსერვისი'}${districtInfo ? ` ${districtInfo.nameLocative}` : ''}`;
  const path = modelPath(brand.slug,modelSlug!,categorySlug,district);
  const canonical = `https://fixup.ge${path}`;
  const metadataError = Boolean(categorySlug && isError);
  const pending = !metadataError && (loading || Boolean(categorySlug && categoriesLoading));
  const providers = new Set(services.map(s=>s.mechanic.id).filter(Boolean)).size;
  const description = `${heading}. ${services.length} შესაბამისი მომსახურება, ${providers} მიმწოდებელი. შეადარეთ მითითებული ფასები, მისამართები და შეფასებები FixUp-ზე.`;
  const breadcrumbs = [{name:'მთავარი',url:'https://fixup.ge/'},{name:brand.nameKa,url:`https://fixup.ge/brand/${brand.slug}`},{name:heading,url:canonical}];
  return <div className="min-h-screen flex flex-col">
    <SEOHead title={`${heading} | FixUp`} description={description} canonical={canonical} noindex={!pending && services.length===0 || isError} />
    <BreadcrumbSchema items={breadcrumbs} />
    {services.length>0 && <CollectionPageSchema name={heading} description={description} numberOfItems={services.length} itemList={services.map(s=>({name:s.name,url:`https://fixup.ge/service/${s.slug || createServiceSlug(s.id,s.name)}`,image:s.photos?.[0],price:s.price_from || undefined}))} />}
    <Header />
    <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
      <nav aria-label="გვერდის მდებარეობა" className="flex flex-wrap gap-2 text-sm text-primary"><Link to="/brand">მარკები</Link><span>›</span><Link to={`/brand/${brand.slug}`}>{brand.nameKa}</Link><span>›</span><span>{model}</span></nav>
      <div><h1 className="text-2xl md:text-4xl font-bold">{heading}</h1><p className="text-muted-foreground mt-3">{pending ? 'მომსახურებები იტვირთება…' : `${services.length} მომსახურება · ${providers} მიმწოდებელი`}</p></div>
      {metadataError ? <div role="alert" className="rounded-lg border p-6"><p>მონაცემები ვერ ჩაიტვირთა.</p><button className="text-primary underline" onClick={() => refetch()}>ხელახლა ცდა</button></div> : pending ? <p role="status">მონაცემები იტვირთება…</p> : services.length ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{services.map(s=><ServiceCard key={s.id} service={s} />)}</div> : <div className="rounded-lg border p-6"><p>ამ მოდელისა და მომსახურების დადასტურებული შეთავაზება ჯერ არ არის.</p><Link className="text-primary underline" to={`/brand/${brand.slug}`}>ნახეთ {brand.nameKaGen} სხვა მომსახურებები</Link></div>}
      <details className="rounded-lg border p-5"><summary className="cursor-pointer font-semibold text-primary">{label} — მომსახურების შესახებ · მეტის ნახვა</summary><div className="mt-4 space-y-3 text-muted-foreground"><p>{heading}: აქ ჩნდება მხოლოდ ის განცხადებები, რომლებშიც მოდელის შესაბამისობა მიმწოდებელმა ან ადმინისტრატორმა დაადასტურა.</p><p>შეამოწმეთ განცხადების სამუშაოს აღწერა, მისამართი და მითითებული ფასი. დარეკვისას დააზუსტეთ ავტომობილის წელი, ძრავის ან ტრანსმისიის ვერსია და საჭირო სამუშაო — ერთი მოდელის სხვადასხვა ვერსიას შეიძლება განსხვავებული მომსახურება სჭირდებოდეს.</p><p>კონკრეტული მომსახურება{category ? ` — ${category.name}` : ''} ამავე განცხადების კატეგორიით განისაზღვრება.</p></div></details>
      <ModelLinks brand={brand} currentPath={path} />
    </main><Footer />
  </div>;
}
