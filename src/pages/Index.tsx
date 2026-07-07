import Header from "@/components/layout/Header";
import TopRibbon from "@/components/layout/TopRibbon";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import SEOHead from "@/components/seo/SEOHead";
import { OrganizationSchema, WebSiteSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { generateSEOTitle, generateSEODescription, generateCanonicalURL } from "@/utils/seoUtils";
import LandingHero from "@/components/home/LandingHero";

const Index = () => {
  const canonicalUrl = generateCanonicalURL("home", {});

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-ink-50 pb-[70px] md:pb-0 lg:overflow-hidden">
      <SEOHead
        title={generateSEOTitle("home", {})}
        description={generateSEODescription("home", {})}
        keywords="ავტოხელოსანი, ავტოსერვისი, მექანიკოსი, ავტომობილის რემონტი, საქართველო, თბილისი, fixup"
        url={canonicalUrl}
        canonical={canonicalUrl}
        type="website"
      />
      <OrganizationSchema
        name="ავტოხელოსანი"
        url="https://fixup.ge"
        description="საქართველოს სანდო ავტოსერვისების პლატფორმა"
        contactPoint={{ contactType: "customer service", email: "info@fixup.ge" }}
      />
      <WebSiteSchema />
      <BreadcrumbSchema items={[{ name: "მთავარი", url: "https://fixup.ge/" }]} />

      <TopRibbon />
      <Header />

      <main className="flex-grow flex flex-col lg:min-h-0">
        {/* The entire homepage is the Planflow "landing" bento hero. */}
        <LandingHero />
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default Index;
