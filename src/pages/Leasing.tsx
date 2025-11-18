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
import { DollarSign, CheckCircle2, Clock, Shield } from "lucide-react";

const Leasing = () => {
  const canonicalUrl = generateCanonicalURL('leasing', {});

  const benefits = [
    {
      icon: DollarSign,
      title: "მოქნილი გადახდა",
      description: "აირჩიეთ თქვენთვის სასურველი გადახდის გრაფიკი",
    },
    {
      icon: Clock,
      title: "სწრაფი განხილვა",
      description: "განაცხადის განხილვა 24 საათში",
    },
    {
      icon: Shield,
      title: "საიმედო პარტნიორები",
      description: "ვთანამშრომლობთ მხოლოდ ლიცენზირებულ კომპანიებთან",
    },
    {
      icon: CheckCircle2,
      title: "მარტივი პირობები",
      description: "მინიმალური დოკუმენტაცია და გამჭვირვალე პირობები",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50 pb-[70px] md:pb-0">
      <SEOHead
        title={generateSEOTitle('leasing', {})}
        description={generateSEODescription('leasing', {})}
        keywords="ავტოლიზინგი, ავტომობილის ლიზინგი, მანქანის ლიზინგი, საქართველო, თბილისი"
        url={canonicalUrl}
        canonical={canonicalUrl}
        type="website"
      />

      <BreadcrumbSchema
        items={[
          { name: 'მთავარი', url: 'https://fixup.ge/' },
          { name: 'ავტოლიზინგები', url: canonicalUrl },
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
            <div className="flex justify-center pt-8 mb-8">
              <Badge className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-2 text-sm font-medium">
                <DollarSign className="h-4 w-4 mr-2" />
                ავტომობილის ლიზინგი
              </Badge>
            </div>

            {/* Service Navigation */}
            <div>
              <ServicePageNavigation currentPage="leasing" />
            </div>

            {/* Lead Form first, then Benefits */}
            <div className="flex flex-col gap-12">
              {/* Lead Form */}
              <div>
                <LeadForm
                  leadType="leasing"
                  title="დატოვეთ განაცხადი ლიზინგზე"
                  description="შეავსეთ ფორმა და ჩვენი მენეჯერი დაგიკავშირდებათ 24 საათში"
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
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Leasing;
