import HorizontalScroll from "@/components/fuel/HorizontalScroll";
import { fuelLandingPages, matchesFuelLanding, initialFuelTier } from "@/lib/fuelLandingPages";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useFuelImporters } from "@/hooks/useFuelImporters";
import FuelHero from "@/components/fuel/FuelHero";
import FuelCompanyPrices from "@/components/fuel/FuelCompanyPrices";
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

      <div className="container mx-auto px-4 py-4 md:py-6">
        <HorizontalScroll className="mb-2" tabIndex={0} aria-label="გვერდის სათაური">
          <h1 className="text-xl md:text-3xl font-bold whitespace-nowrap leading-8">{heading}</h1>
        </HorizontalScroll>
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-green-600 shrink-0" aria-hidden="true" />
          {visibleImporters.length ? `${visibleImporters.length} კომპანიის მონაცემები` : 'კომპანიების ფასები'}
          <span aria-hidden="true">·</span> სტანდარტული და თვითმომსახურება
        </p>
        <details className="group mb-3 rounded-xl border border-border/60 bg-card">
          <summary className="cursor-pointer list-none px-3 py-2 text-sm text-primary font-medium flex items-center justify-between">
            <span>ფასების შესახებ</span>
            <span className="group-open:hidden">მეტის ნახვა +</span>
            <span className="hidden group-open:inline">დამალვა −</span>
          </summary>
          <div className="border-t px-3 py-3 space-y-3">
            <h2 className="text-sm font-semibold">შეადარეთ პროდუქტები და გადაამოწმეთ მონაცემის განახლების დრო</h2>
            <p className="text-sm text-muted-foreground">{topic?.intro ?? 'შეადარეთ ერთი კლასის საწვავი კომპანიებს შორის. მიღების დრო არის მონაცემის ჩამოტვირთვის დრო; საბოლოო ფასი და პირობები გადაამოწმეთ სადგურთან.'}</p>
            <HorizontalScroll role="navigation" aria-label="საწვავის ფასების გვერდები" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Link className="shrink-0 rounded-full border px-3 py-1.5 text-xs text-primary whitespace-nowrap" to="/fuel-importers">ყველა საწვავი</Link>
              {fuelLandingPages.filter(page => page.selfService === Boolean(topic?.selfService) || page.slug === 'self-service').map(page => (
                <Link key={page.slug} className="shrink-0 rounded-full border px-3 py-1.5 text-xs text-primary whitespace-nowrap" aria-current={page === topic ? 'page' : undefined} to={`/fuel-prices/${page.slug}`}>{page.name}</Link>
              ))}
            </HorizontalScroll>
          </div>
        </details>
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
        <FuelCompanyPrices key={`${pathname}-companies`} importers={visibleImporters} initialSelfService={Boolean(topic?.selfService)} />
        <details className="group mt-5 rounded-xl border bg-card">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold flex justify-between gap-3">
            <span>ყველა პროდუქტის ფასები</span><span className="text-primary group-open:hidden">მეტის ნახვა +</span><span className="text-primary hidden group-open:inline">დამალვა −</span>
          </summary>
        <section className="p-4 border-t" aria-label="საწვავის ფასების ცხრილი">
          <h2 className="text-xl font-bold mb-3">{topic?.name ?? 'საწვავის ფასები'} — ბრენდების მიხედვით</h2>
          <p className="text-sm text-muted-foreground mb-3">მოცემულია სტანდარტული და, სადაც წყაროში არის მითითებული, თვითმომსახურების ფასები. მიღების დრო ასახავს მონაცემის ჩამოტვირთვას და არა კომპანიის მიერ ფასის შეცვლის დროს. სადგურის პირობები გადაამოწმეთ.</p>
          <HorizontalScroll aria-label="საწვავის ცხრილის გადასქროლვა">
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
          </HorizontalScroll>
          {!isLoading && !visibleImporters.some(company => company.fuelPrices?.length) && <p>ფასები დროებით მიუწვდომელია. სცადეთ განახლება.</p>}
        </section>
        </details>
      </div>

      <FuelHero />

      {topic && <details className="group container mx-auto px-4 mb-6" aria-label={`${topic.name} — ინფორმაცია`}>
        <summary className="cursor-pointer text-sm font-semibold text-primary">{topic.name} — მეტის ნახვა</summary>
        <div className="mt-3 space-y-4 text-sm text-muted-foreground">
          <h2 className="text-lg font-semibold text-foreground">{topic.name} საქართველოში — როგორ შევადაროთ</h2>
          <p>{topic.name} ამ გვერდზე მოცემულია კომპანიებისა და კონკრეტული პროდუქტების მიხედვით. {topic.intro}</p>
          <h3 className="font-semibold text-foreground">რა განსაზღვრავს არჩევანს?</h3>
          <p>{topic.tiers.includes('cng') ? 'ბუნებრივი აირის (CNG) ფასების შედარებისას გადაამოწმეთ სადგურზე მითითებული საზომი ერთეული და თქვენი ავტომობილის სისტემის თავსებადობა. CNG-ისა და LPG-ის ფასები სხვადასხვა პროდუქტს ეხება.' : topic.tiers.includes('lpg') ? 'თხევადი გაზის (LPG) ფასების შედარებისას გაითვალისწინეთ სადგურის მდებარეობა და მომსახურების პირობები. LPG და CNG სხვადასხვა პროდუქტია; არჩევანი ავტომობილის შესაბამის სისტემას უნდა ერგებოდეს.' : topic.tiers.includes('diesel') ? 'დიზელის ფასებთან ერთად შეადარეთ პროდუქტის სრული დასახელება და წყაროში მითითებული მახასიათებელი. სხვადასხვა დასახელების დიზელს განსხვავებული შემადგენლობა და სპეციფიკაცია შეიძლება ჰქონდეს.' : topic.tiers.length ? 'ბენზინის ფასებთან ერთად ყურადღება მიაქციეთ ოქტანობასა და პროდუქტის სრულ დასახელებას. სუპერი, პრემიუმი და რეგულარი ცალკე კლასებია; შეადარეთ ავტომობილის მოთხოვნებთან შესაბამისი პროდუქტები.' : 'თვითმომსახურების საწვავის არჩევისას ჯერ განსაზღვრეთ საჭირო საწვავის ტიპი და პროდუქტი, შემდეგ შეადარეთ შესაბამისი კომპანიების ტარიფები. ყველა პროდუქტის თვითმომსახურების ფასი წყაროში ხელმისაწვდომი არ არის.'}</p>
          <h3 className="font-semibold text-foreground">როგორ წავიკითხოთ ფასები და განახლების დრო?</h3>
          <p>{topic.selfService ? 'თვითმომსახურების ფასები ცალკე ტარიფია. ნაჩვენებია მხოლოდ წყაროში პირდაპირ მითითებული მნიშვნელობები; სტანდარტული ფასი თვითმომსახურების ფასად არ გამოიყენება.' : 'კომპანიების ბარათებში სტანდარტული ფასებია. სადაც წყარო თვითმომსახურების ტარიფსაც გვაწვდის, მისი ნახვა შესაბამისი გადამრთველით შეგიძლიათ.'} მიღების დრო აღნიშნავს მონაცემის ჩამოტვირთვის დროს. მიმდინარე ფასი, ფილიალში ხელმისაწვდომობა და ფასდაკლების პირობები გადაამოწმეთ სადგურთან.</p>
          <h3 className="font-semibold text-foreground">{topic.name} — ხშირად დასმული კითხვა</h3>
          <p>ყველაზე დაბალი ფასი როგორ ვიპოვო? შედარების სექციაში აირჩიეთ შესაბამისი პროდუქტის კლასი და ტარიფი. პირველი პოზიცია აჩვენებს ამ არჩევანის ყველაზე დაბალ ხელმისაწვდომ ფასს; კომპანიის ბარათში ნახავთ პროდუქტის სრულ დასახელებასა და წყაროს.</p>
          <Link className="inline-block text-primary underline" to="/fuel-importers">ყველა საწვავის ფასის შედარება</Link>
        </div>
      </details>}

      {/* Long-form SEO content — intro + highlights + tips + FAQ + related blogs */}
      {!topic && <details className="group container mx-auto px-4 mb-6">
        <summary className="cursor-pointer text-sm font-semibold text-primary">საწვავის შესახებ — მეტის ნახვა</summary>
        <StaticPageSeoBlock
        introHeading={FUEL_IMPORTERS_CONTENT.introHeading}
        introHtml={FUEL_IMPORTERS_CONTENT.introHtml}
        highlights={FUEL_IMPORTERS_CONTENT.highlights}
        highlightsHeading={FUEL_IMPORTERS_CONTENT.highlightsHeading}
        tips={FUEL_IMPORTERS_CONTENT.tips}
        tipsHeading={FUEL_IMPORTERS_CONTENT.tipsHeading}
        faqItems={FUEL_IMPORTERS_CONTENT.faqItems}
        faqHeading={FUEL_IMPORTERS_CONTENT.faqHeading}
        topicName={FUEL_IMPORTERS_CONTENT.topicName}
      /></details>}
    </Layout>
  );
};

export default FuelImporters;
