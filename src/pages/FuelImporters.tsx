import { useFuelImporters } from "@/hooks/useFuelImporters";
import FuelHero from "@/components/fuel/FuelHero";
import FuelPriceExplorer from "@/components/fuel/FuelPriceExplorer";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { StaticPageSeoBlock } from "@/components/seo/StaticPageSeoBlock";
import { FUEL_IMPORTERS_CONTENT } from "@/utils/staticPagesSeoContent";
import { toast } from "sonner";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/mobile/PullToRefreshIndicator";

const FuelImporters = () => {
  const { data: importers = [], isLoading, refetch, isRefetching } = useFuelImporters({ english: true });

  const handleRefresh = async () => {
    await refetch();
    toast.success("მონაცემები წარმატებით განახლდა");
  };

  // Pull to refresh functionality
  const { pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  return (
    <Layout>
      <SEOHead
        title="საწვავის ფასები დღეს საქართველოში — Live | FixUp"
        description={`საწვავის ფასები ცოცხალი მონაცემებით — ${importers.length}+ კომპანია (SOCAR, WISSOL, GULF, ROMPETROL, Lukoil). სუპერი, პრემიუმი, რეგულარი, დიზელი, აირი. ფასების შედარება და დღევანდელი ცვლილებები.`}
        keywords="საწვავის ფასები დღეს, ბენზინი, დიზელი, საწვავის ფასი, ბენზინის ფასები დღეს, საწვავის ფასები live, საწვავის ფასები ონლაინ, საწვავის ფასები საქართველოში, RON 98, RON 96, RON 93, SOCAR, WISSOL, GULF, ROMPETROL"
      />

      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} threshold={80} />

      <FuelHero />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          საწვავის ფასები დღეს საქართველოში
        </h1>
        <p className="flex items-center gap-2 text-sm md:text-base text-muted-foreground mb-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            LIVE
          </span>
          <span>ცოცხალი ფასები {importers.length}+ კომპანიიდან — ბენზინი, დიზელი, აირი</span>
        </p>
        <h2 className="hidden md:block text-lg text-muted-foreground mb-6">
          შეარჩიეთ საწვავის ფასები ონლაინ, LIVE მონიტორინგი მთელი საქართველოს მასშტაბით
        </h2>
        {/* Octane-tier comparison — compare like-for-like across companies,
            comparison view first. */}
        <FuelPriceExplorer
          importers={importers}
          isLoading={isLoading}
          isRefetching={isRefetching}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Long-form SEO content — intro + highlights + tips + FAQ + related blogs */}
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
      />
    </Layout>
  );
};

export default FuelImporters;
