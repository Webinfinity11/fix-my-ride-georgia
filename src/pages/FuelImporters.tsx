import { fuelTier } from "@/lib/fuelTypes";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useFuelImporters } from "@/hooks/useFuelImporters";
import FuelHero from "@/components/fuel/FuelHero";
import FuelPriceExplorer from "@/components/fuel/FuelPriceExplorer";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { StaticPageSeoBlock } from "@/components/seo/StaticPageSeoBlock";
import { FUEL_IMPORTERS_CONTENT } from "@/utils/staticPagesSeoContent";
import NotFound from "./NotFound";
import { toast } from "sonner";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/mobile/PullToRefreshIndicator";

const FUEL_TOPICS = {
  petrol: { name: 'ბენზინის ფასები დღეს', tier: 'regular' as const, match: /სუპერ|პრემიუმ|რეგულარ|super|premium|regular/i,
    intro: 'შეადარეთ რეგულარის, პრემიუმისა და სუპერის ფასები ცალ-ცალკე. სხვადასხვა ოქტანობის პროდუქტები პირდაპირ შესადარებელი არ არის. აირჩიეთ თქვენი ავტომობილის მწარმოებლის მიერ მოთხოვნილი საწვავი.' },
  diesel: { name: 'დიზელის ფასები დღეს', tier: 'diesel' as const, match: /დიზელ|diesel/i,
    intro: 'შეადარეთ დიზელის პროდუქტები ბრენდისა და დასახელების მიხედვით. ერთი კომპანიის სხვადასხვა დიზელის პროდუქტი შეიძლება ფასითა და სპეციფიკაციით განსხვავდებოდეს; გადაამოწმეთ მოთხოვნები ავტომობილის სახელმძღვანელოში.' },
};

const FuelImporters = () => {
  const { fuelType } = useParams<{ fuelType?: string }>();
  const topic = FUEL_TOPICS[fuelType as keyof typeof FUEL_TOPICS];
  const heading = topic ? `${topic.name} საქართველოში` : 'საწვავის ფასები დღეს საქართველოში';
  const { data: importers = [], isLoading, refetch, isRefetching } = useFuelImporters({ english: true });

  const visibleImporters = topic ? importers.map(company => ({ ...company,
    fuelPrices: company.fuelPrices?.filter(fuel => (fuelType === 'diesel' ? fuelTier(`${fuel.fuelType} ${fuel.fuelTypeEnglish ?? ''}`) === 'diesel' : ['regular', 'premium', 'super'].includes(fuelTier(`${fuel.fuelType} ${fuel.fuelTypeEnglish ?? ''}`) ?? ''))),
  })).filter(company => company.fuelPrices?.length) : importers;
  useEffect(() => {
    if (window.__fixupPrerenderCapture && importers.some(company => company.fuelPrices?.length)) {
      const dates = importers.map(company => Date.parse(company.lastUpdated ?? '')).filter(Number.isFinite);
      window.__fixupFuelSnapshotCapture = { data: importers, ts: dates.length ? Math.min(...dates) : 0 };
    }
  }, [importers]);

  const handleRefresh = async () => {
    await refetch();
    toast.success("მონაცემები წარმატებით განახლდა");
  };

  // Pull to refresh functionality
  const { pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  if (fuelType && !topic) return <NotFound />;

  return (
    <Layout>
      <SEOHead
        title={`${heading} — ფასების შედარება | FixUp`}
        canonical={`https://fixup.ge${topic ? `/fuel-prices/${fuelType}` : "/fuel-importers"}`}
        description={`${heading} — შეადარეთ პროდუქტები და კომპანიების საჯარო ფასები. მონაცემების განახლების დრო, ფასების ცხრილი და კალკულატორი.`}
        keywords="საწვავის ფასები დღეს, ბენზინი, დიზელი, საწვავის ფასი, ბენზინის ფასები დღეს, საწვავის ფასები live, საწვავის ფასები ონლაინ, საწვავის ფასები საქართველოში, RON 98, RON 96, RON 93, SOCAR, WISSOL, GULF, ROMPETROL"
      />

      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} threshold={80} />

      <FuelHero />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          {heading}
        </h1>
        <p className="flex items-center gap-2 text-sm md:text-base text-muted-foreground mb-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            ფასების შედარება
          </span>
          <span>{visibleImporters.length ? `${visibleImporters.length} კომპანიის მონაცემები` : "კომპანიების ფასები"} — {topic ? topic.name : "ბენზინი, დიზელი, აირი"}</span>
        </p>
        <h2 className="hidden md:block text-lg text-muted-foreground mb-6">
          შეადარეთ პროდუქტები და გადაამოწმეთ მონაცემის განახლების დრო
        </h2>
        {/* Octane-tier comparison — compare like-for-like across companies,
            comparison view first. */}
        {topic && <p className="mb-5 text-muted-foreground">{topic.intro}</p>}
        <nav aria-label="საწვავის ფასების გვერდები" className="flex flex-wrap gap-4 mb-5">
          <Link className="text-primary underline" to="/fuel-importers">ყველა საწვავი</Link>
          <Link className="text-primary underline" to="/fuel-prices/petrol">ბენზინის ფასები</Link>
          <Link className="text-primary underline" to="/fuel-prices/diesel">დიზელის ფასები</Link>
        </nav>
        <FuelPriceExplorer
          key={fuelType ?? "all"}
          initialTier={topic?.tier}
          importers={visibleImporters}
          isLoading={isLoading}
          isRefetching={isRefetching}
          onRefresh={handleRefresh}
        />
        <section className="mt-8" aria-label="საწვავის ფასების ცხრილი">
          <h2 className="text-xl font-bold mb-3">{topic?.name ?? 'საწვავის ფასები'} — ბრენდების მიხედვით</h2>
          <p className="text-sm text-muted-foreground mb-3">მონაცემები კომპანიების საჯარო ფასებიდან. განახლების დრო მითითებულია თითოეულ პროდუქტთან; სადგურზე ფასი და ფასდაკლების პირობები გადაამოწმეთ.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr><th className="p-2">კომპანია</th><th className="p-2">პროდუქტი</th><th className="p-2">ფასი, ₾/ლ</th><th className="p-2">მონაცემის დრო</th></tr></thead>
              <tbody>{visibleImporters.flatMap(company => (company.fuelPrices ?? []).filter(fuel => Number.isFinite(fuel.price) && fuel.price > 0).map((fuel, index) => (
                <tr key={`${company.name}-${index}`} className="border-t">
                  <td className="p-2">{company.name}</td><td className="p-2">{fuel.fuelType}</td><td className="p-2 tabular-nums">{fuel.price.toFixed(2)}</td>
                  <td className="p-2">{company.lastUpdated && Number.isFinite(Date.parse(company.lastUpdated)) ? <time dateTime={company.lastUpdated}>{new Date(company.lastUpdated).toLocaleString('ka-GE', { timeZone: 'Asia/Tbilisi' })}</time> : 'დრო არ არის მითითებული'}</td>
                </tr>
              )))}</tbody>
            </table>
          </div>
          {!isLoading && !visibleImporters.some(company => company.fuelPrices?.length) && <p>ფასები დროებით მიუწვდომელია. სცადეთ განახლება.</p>}
        </section>
      </div>

      {/* Long-form SEO content — intro + highlights + tips + FAQ + related blogs */}
      {!topic && <StaticPageSeoBlock
        introHeading={FUEL_IMPORTERS_CONTENT.introHeading}
        introHtml={FUEL_IMPORTERS_CONTENT.introHtml}
        highlights={FUEL_IMPORTERS_CONTENT.highlights}
        highlightsHeading={FUEL_IMPORTERS_CONTENT.highlightsHeading}
        tips={FUEL_IMPORTERS_CONTENT.tips}
        tipsHeading={FUEL_IMPORTERS_CONTENT.tipsHeading}
        faqItems={FUEL_IMPORTERS_CONTENT.faqItems}
        faqHeading={FUEL_IMPORTERS_CONTENT.faqHeading}
        topicName={FUEL_IMPORTERS_CONTENT.topicName}
      />}
    </Layout>
  );
};

export default FuelImporters;
