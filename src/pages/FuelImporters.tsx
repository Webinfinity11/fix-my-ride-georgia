import { fuelLandingPages, matchesFuelLanding, initialFuelTier } from "@/lib/fuelLandingPages";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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

const FuelImporters = () => {
  const pathname = useLocation().pathname.replace(/\/$/, '');
  const slug = pathname.startsWith('/fuel-prices/') ? pathname.slice('/fuel-prices/'.length) : '';
  const topic = fuelLandingPages.find(page => page.slug === slug);
  const heading = topic ? `${topic.name} საქართველოში` : 'საწვავის ფასები დღეს საქართველოში';
  const { data: importers = [], isLoading, refetch, isRefetching } = useFuelImporters({ english: true });

  const visibleImporters = topic ? importers.map(company => ({ ...company,
    fuelPrices: company.fuelPrices?.filter(fuel => matchesFuelLanding(fuel, topic)),
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

  if (slug && !topic) return <NotFound />;

  return (
    <Layout>
      <SEOHead
        title={`${heading} — ფასების შედარება | FixUp`}
        canonical={`https://fixup.ge${topic ? `/fuel-prices/${slug}` : "/fuel-importers"}`}
        description={`${heading} — შეადარეთ პროდუქტები და კომპანიების საჯარო ფასები. მონაცემების განახლების დრო, ფასების ცხრილი და კალკულატორი.`}
        noindex={Boolean(topic) && !isLoading && visibleImporters.length === 0}
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
          {fuelLandingPages.filter(page => page.selfService === Boolean(topic?.selfService) || page.slug === 'self-service').map(page => (
            <Link key={page.slug} className="text-primary underline" aria-current={page === topic ? 'page' : undefined} to={`/fuel-prices/${page.slug}`}>{page.name}</Link>
          ))}
        </nav>
        <FuelPriceExplorer
          key={pathname}
          initialTier={initialFuelTier(topic)}
          initialSelfService={topic?.selfService}
          landingSlug={slug}
          importers={importers}
          isLoading={isLoading}
          isRefetching={isRefetching}
          onRefresh={handleRefresh}
        />
        <section className="mt-8" aria-label="საწვავის ფასების ცხრილი">
          <h2 className="text-xl font-bold mb-3">{topic?.name ?? 'საწვავის ფასები'} — ბრენდების მიხედვით</h2>
          <p className="text-sm text-muted-foreground mb-3">მოცემულია სტანდარტული და, სადაც წყაროში არის მითითებული, თვითმომსახურების ფასები. მიღების დრო ასახავს მონაცემის ჩამოტვირთვას და არა კომპანიის მიერ ფასის შეცვლის დროს. სადგურის პირობები გადაამოწმეთ.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr><th className="p-2">კომპანია</th><th className="p-2">პროდუქტი</th><th className="p-2">ფასი, ₾/ლ</th><th className="p-2">თვითმომსახურება, ₾/ლ</th><th className="p-2">მიღების დრო</th><th className="p-2">წყარო</th></tr></thead>
              <tbody>{visibleImporters.flatMap(company => (company.fuelPrices ?? []).filter(fuel => Number.isFinite(fuel.price) && fuel.price > 0).map((fuel, index) => (
                <tr key={`${company.name}-${index}`} className="border-t">
                  <td className="p-2">{company.name}</td><td className="p-2">{fuel.fuelType}</td><td className="p-2 tabular-nums">{fuel.price.toFixed(2)}</td>
                  <td className="p-2 tabular-nums">{typeof fuel.selfServicePrice === "number" ? fuel.selfServicePrice.toFixed(2) : "—"}</td>
                  <td className="p-2">{company.lastUpdated && Number.isFinite(Date.parse(company.lastUpdated)) ? <time dateTime={company.lastUpdated}>{new Date(company.lastUpdated).toLocaleString('ka-GE', { timeZone: 'Asia/Tbilisi' })}</time> : 'დრო არ არის მითითებული'}</td>
                  <td className="p-2">{company.sourceUrl?.startsWith('https://priceshub.ge/') ? <a className="text-primary underline" href={company.sourceUrl} target="_blank" rel="noopener noreferrer">PricesHub.ge</a> : 'პირდაპირი წყარო'}</td>
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
