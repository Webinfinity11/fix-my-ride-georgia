import Layout from "@/components/layout/Layout";
import { FuelBrandVoting } from "@/components/fuel/FuelBrandVoting";
import SEOHead from "@/components/seo/SEOHead";
import { StaticPageSeoBlock } from "@/components/seo/StaticPageSeoBlock";
import { FUEL_BRANDS_CONTENT } from "@/utils/staticPagesSeoContent";

const FuelBrands = () => {
  return (
    <Layout>
      <SEOHead
        title="საწვავის ბრენდები საქართველოში — შედარება და რეიტინგი | FixUp"
        description="საქართველოს წამყვანი საწვავის ბრენდები: Gulf, Socar, Wissol, Lukoil, Connect. რეიტინგი მომხმარებლების ხმის საფუძველზე, ფასების შედარება და ხარისხის შეფასება."
        keywords="საწვავი, ბრენდები, Gulf, Socar, Wissol, Lukoil, Connect, რეიტინგი, ბენზინი, დიზელი"
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* SEO H1 — was missing entirely; now wraps the voting widget */}
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
            {FUEL_BRANDS_CONTENT.h1}
          </h1>
          {FUEL_BRANDS_CONTENT.h1Subtitle && (
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {FUEL_BRANDS_CONTENT.h1Subtitle}
            </p>
          )}
        </header>

        <FuelBrandVoting />
      </div>

      {/* Long-form SEO content below the interactive voting widget */}
      <StaticPageSeoBlock
        introHeading={FUEL_BRANDS_CONTENT.introHeading}
        introHtml={FUEL_BRANDS_CONTENT.introHtml}
        highlights={FUEL_BRANDS_CONTENT.highlights}
        highlightsHeading={FUEL_BRANDS_CONTENT.highlightsHeading}
        tips={FUEL_BRANDS_CONTENT.tips}
        tipsHeading={FUEL_BRANDS_CONTENT.tipsHeading}
        faqItems={FUEL_BRANDS_CONTENT.faqItems}
        faqHeading={FUEL_BRANDS_CONTENT.faqHeading}
        topicName={FUEL_BRANDS_CONTENT.topicName}
      />
    </Layout>
  );
};

export default FuelBrands;
