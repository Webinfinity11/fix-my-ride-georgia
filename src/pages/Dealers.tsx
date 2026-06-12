import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { LeadForm } from "@/components/forms/LeadForm";
import SEOHead from "@/components/seo/SEOHead";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";
import { generateSEOTitle, generateSEODescription, generateCanonicalURL } from "@/utils/seoUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServicePageNavigation } from "@/components/services/ServicePageNavigation";
import { Car, CheckCircle2, Award, ThumbsUp, FileCheck } from "lucide-react";
import { StaticPageSeoBlock } from "@/components/seo/StaticPageSeoBlock";
import { DEALERS_CONTENT } from "@/utils/staticPagesSeoContent";

const Dealers = () => {
  const canonicalUrl = generateCanonicalURL('dealers', {});

  const benefits = [
    {
      icon: Car,
      title: "ფართო არჩევანი",
      description: "ათასობით მანქანა ერთ პლატფორმაზე",
    },
    {
      icon: Award,
      title: "ოფიციალური დილერები",
      description: "მხოლოდ გადამოწმებული და სანდო კომპანიები",
    },
    {
      icon: FileCheck,
      title: "უსაფრთხო გარიგება",
      description: "სრული იურიდიული მხარდაჭერა",
    },
    {
      icon: ThumbsUp,
      title: "საუკეთესო პირობები",
      description: "კონკურენტული ფასები და სპეციალური შეთავაზებები",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50 pb-[70px] md:pb-0">
      <SEOHead
        title={generateSEOTitle('dealers', {})}
        description={generateSEODescription('dealers', {})}
        keywords="ავტოდილერები, მანქანის ყიდვა, ავტომობილის ყიდვა, საქართველო, თბილისი, ახალი მანქანა"
        url={canonicalUrl}
        canonical={canonicalUrl}
        type="website"
      />

      <BreadcrumbSchema
        items={[
          { name: 'მთავარი', url: 'https://fixup.ge/' },
          { name: 'ავტოდილერები', url: canonicalUrl },
        ]}
      />

      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-blue-50 to-purple-50"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-blue-200/20 rounded-full blur-3xl"></div>

          <div className="container mx-auto px-4 relative z-10">
            {/* Badge */}
            <div className="flex justify-center pt-8 mb-4">
              <Badge className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-2 text-sm font-medium">
                <Car className="h-4 w-4 mr-2" />
                ავტომობილების ოფიციალური დილერები
              </Badge>
            </div>

            {/* SEO H1 */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
                {DEALERS_CONTENT.h1}
              </h1>
              {DEALERS_CONTENT.h1Subtitle && (
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                  {DEALERS_CONTENT.h1Subtitle}
                </p>
              )}
            </div>

            {/* Service Navigation */}
            <div>
              <ServicePageNavigation currentPage="dealers" />
            </div>

            {/* Lead Form first, then Benefits */}
            <div className="flex flex-col gap-12">
              {/* Lead Form */}
              <div>
                <LeadForm
                  leadType="dealers"
                  title="დატოვეთ განაცხადი"
                  description="შეავსეთ ფორმა და ჩვენი მენეჯერი დაგიკავშირდებათ საუკეთესო შეთავაზებებით"
                />
              </div>

              {/* Benefits */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {benefits.map((benefit, index) => (
                    <Card key={index} className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <div className="p-3 bg-gradient-to-r from-primary to-blue-600 rounded-full w-fit mx-auto mb-4">
                          <benefit.icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                        <p className="text-sm text-gray-600">{benefit.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEO content block — intro + highlights + tips + FAQ + related blogs */}
        <StaticPageSeoBlock
          introHeading={DEALERS_CONTENT.introHeading}
          introHtml={DEALERS_CONTENT.introHtml}
          highlights={DEALERS_CONTENT.highlights}
          highlightsHeading={DEALERS_CONTENT.highlightsHeading}
          tips={DEALERS_CONTENT.tips}
          tipsHeading={DEALERS_CONTENT.tipsHeading}
          faqItems={DEALERS_CONTENT.faqItems}
          faqHeading={DEALERS_CONTENT.faqHeading}
          topicName={DEALERS_CONTENT.topicName}
        />
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Dealers;
