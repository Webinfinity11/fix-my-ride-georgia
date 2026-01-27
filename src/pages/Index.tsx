import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/seo/SEOHead";
import { OrganizationSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { generateSEOTitle, generateSEODescription, generateCanonicalURL } from "@/utils/seoUtils";
import SimplifiedSearch from "@/components/home/SimplifiedSearch";
import CategoryCarousel from "@/components/home/CategoryCarousel";
import VIPServicesCarousel from "@/components/home/VIPServicesCarousel";
import StationsPromo from "@/components/home/StationsPromo";
import { Zap, Shield, Users, Star, ArrowRight, Sparkles, UserPlus, Wrench, Car, DollarSign } from "lucide-react";
import HomeCenterBanner from "@/components/banners/HomeCenterBanner";
import MobileBanner from "@/components/banners/MobileBanner";
import { EvacuatorDialog } from "@/components/evacuator/EvacuatorDialog";
import { useSitemapAutoUpdate } from "@/hooks/useSitemapAutoUpdate";

// სტატისტიკა
const stats = [{
  number: "500+",
  label: "ხელოსანი",
  icon: Users
}, {
  number: "500+",
  label: "სერვისი",
  icon: Zap
}, {
  number: "50,000+",
  label: "მომხმარებელი",
  icon: Shield
}, {
  number: "4.8★",
  label: "საშუალო რეიტინგი",
  icon: Star
}];
const Index = () => {
  // Initialize sitemap auto-update listener
  useSitemapAutoUpdate();
  const navigate = useNavigate();
  const [evacuatorDialogOpen, setEvacuatorDialogOpen] = useState(false);
  const canonicalUrl = generateCanonicalURL("home", {});
  return <div className="min-h-screen flex flex-col bg-gradient-to-br from-muted via-background to-accent/30 pb-[70px] md:pb-0">
      <SEOHead title={generateSEOTitle("home", {})} description={generateSEODescription("home", {})} keywords="ავტოხელოსანი, ავტოსერვისი, მექანიკოსი, ავტომობილის რემონტი, საქართველო, თბილისი, fixup" url={canonicalUrl} canonical={canonicalUrl} type="website" />

      <OrganizationSchema name="ავტოხელოსანი" url="https://fixup.ge" description="საქართველოს უდიდესი ავტოსერვისების პლატფორმა" contactPoint={{
      contactType: "customer service",
      email: "info@fixup.ge"
    }} />

      <BreadcrumbSchema items={[{
      name: "მთავარი",
      url: "https://fixup.ge/"
    }]} />
      <Header />

      <main className="flex-grow">
        {/* Hero Section - Simplified */}
        <section className="relative py-12 lg:py-20 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent to-primary/10"></div>
          <div className="absolute top-0 right-0 w-72 h-72 md:w-96 md:h-96 bg-gradient-to-br from-primary/10 to-accent/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 md:w-96 md:h-96 bg-gradient-to-tr from-accent/20 to-primary/10 rounded-full blur-3xl"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              {/* Hero Content */}
              <div className="text-center mb-8 md:mb-10">
                <Badge className="mb-4 md:mb-6 bg-gradient-to-r from-primary to-primary-light text-primary-foreground px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm font-medium">
                  <Sparkles className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                  საქართველოს #1 ავტო-სერვისის პლატფორმა
                </Badge>
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-4 md:mb-6 leading-tight">
                  იპოვეთ საუკეთესო
                  <span className="bg-gradient-to-r from-primary via-primary-light to-secondary bg-clip-text text-transparent block md:inline md:ml-3">
                    ხელოსანი
                  </span>
                </h1>
              </div>

              {/* Simplified Search Form */}
              <Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-4 md:p-6 lg:p-8">
                  <SimplifiedSearch onEvacuatorClick={() => setEvacuatorDialogOpen(true)} />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Categories Carousel */}
        <section className="py-8 md:py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">კატეგორიები</h2>
                  <p className="text-sm text-muted-foreground mt-1 hidden md:block">
                    აირჩიეთ სასურველი სერვისის კატეგორია
                  </p>
                </div>
                <Link to="/services">
                  <Button variant="ghost" className="text-primary hover:text-primary-dark group">
                    ყველა
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
              <CategoryCarousel />
            </div>
          </div>
        </section>

        {/* VIP Services Carousel */}
        <VIPServicesCarousel />

        {/* Stations Promo */}
        <StationsPromo />

        {/* Stats Section */}
        

        {/* Registration Section */}
        <section className="py-10 md:py-16 bg-gradient-to-br from-muted to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4 bg-gradient-to-r from-primary to-primary-light text-primary-foreground px-4 py-2">
                <UserPlus className="h-4 w-4 mr-2" />
                გაწევრიანდი
              </Badge>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">დაიწყეთ ახლავე</h2>
              <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                შემოუერთდით ჩვენს პლატფორმას და მიიღეთ ან მიაწოდეთ ხარისხიანი ავტოსერვისი
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Registration */}
                <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-2xl transition-all duration-300 group">
                  <CardContent className="p-6 lg:p-8 text-center">
                    <div className="p-4 lg:p-6 bg-primary rounded-full w-fit mx-auto mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                      <Car className="h-8 w-8 lg:h-12 lg:w-12 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-3 lg:mb-4">მომხმარებლად</h3>
                    <p className="text-sm lg:text-base text-muted-foreground mb-4 lg:mb-6">
                      იპოვეთ საუკეთესო ხელოსნები
                    </p>
                    <div className="space-y-3 lg:space-y-4">
                      <Link to="/register?type=customer">
                        <Button className="w-full bg-primary hover:bg-primary-dark text-primary-foreground py-2 lg:py-3 text-base lg:text-lg">
                          რეგისტრაცია მომხმარებლად
                        </Button>
                      </Link>
                      <Link to="/login">
                        <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5 py-2 lg:py-3 text-base lg:text-lg">
                          შესვლა
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Mechanic Registration */}
                <Card className="border-0 shadow-xl bg-gradient-to-br from-secondary/10 to-secondary/5 hover:shadow-2xl transition-all duration-300 group">
                  <CardContent className="p-6 lg:p-8 text-center">
                    <div className="p-4 lg:p-6 bg-secondary rounded-full w-fit mx-auto mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                      <Wrench className="h-8 w-8 lg:h-12 lg:w-12 text-secondary-foreground" />
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-3 lg:mb-4">ხელოსნად</h3>
                    <p className="text-sm lg:text-base text-muted-foreground mb-4 lg:mb-6">
                      გაზარდე შენი სერვისი და მოიძიე ახალი კლიენტები
                    </p>
                    <div className="space-y-3 lg:space-y-4">
                      <Link to="/register?type=mechanic">
                        <Button className="w-full bg-secondary hover:bg-secondary-dark text-secondary-foreground py-2 lg:py-3 text-base lg:text-lg">
                          რეგისტრაცია ხელოსნად
                        </Button>
                      </Link>
                      <Link to="/login">
                        <Button variant="outline" className="w-full border-secondary text-secondary hover:bg-secondary/10 py-2 lg:py-3 text-base lg:text-lg">
                          შესვლა
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Services Section */}
        <section className="py-10 md:py-16 bg-gradient-to-br from-accent/30 via-background to-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-10">
                <Badge className="mb-4 bg-gradient-to-r from-primary to-primary-light text-primary-foreground px-4 py-2">
                  <Star className="h-4 w-4 mr-2" />
                  დამატებითი სერვისები
                </Badge>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">ყველა კომპანია ერთ პლატფორმაზე</h2>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                  დატოვე საკონტაქტო ინფორმაცია და პარტნიორი კომპანიები დაგიკავშირდებიან!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {/* Leasing Card */}
                <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-2xl transition-all duration-300 cursor-pointer group" onClick={() => navigate("/leasing")}>
                  <CardContent className="p-6 lg:p-8 text-center">
                    <div className="p-4 lg:p-6 bg-primary rounded-full w-fit mx-auto mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                      <DollarSign className="h-8 w-8 lg:h-12 lg:w-12 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-3">ავტოლიზინგები</h3>
                    <p className="text-sm lg:text-base text-muted-foreground mb-6">
                      იპოვე საუკეთესო სალიზინგო კომპანია ჩვენი დახმარებით
                    </p>
                    <Button className="w-full bg-primary hover:bg-primary-dark text-primary-foreground">
                      გაიგე მეტი
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Dealers Card */}
                <Card className="border-0 shadow-xl bg-gradient-to-br from-accent to-accent/50 hover:shadow-2xl transition-all duration-300 cursor-pointer group" onClick={() => navigate("/dealers")}>
                  <CardContent className="p-6 lg:p-8 text-center">
                    <div className="p-4 lg:p-6 bg-primary rounded-full w-fit mx-auto mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                      <Car className="h-8 w-8 lg:h-12 lg:w-12 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-3">ავტოდილერები</h3>
                    <p className="text-sm lg:text-base text-muted-foreground mb-6">
                      სანდო დილერები და ავტომობილების ფართო არჩევანი
                    </p>
                    <Button className="w-full bg-primary hover:bg-primary-dark text-primary-foreground">
                      გაიგე მეტი
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Insurance Card */}
                <Card className="border-0 shadow-xl bg-gradient-to-br from-secondary/10 to-secondary/5 hover:shadow-2xl transition-all duration-300 cursor-pointer group" onClick={() => navigate("/insurance")}>
                  <CardContent className="p-6 lg:p-8 text-center">
                    <div className="p-4 lg:p-6 bg-secondary rounded-full w-fit mx-auto mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                      <Shield className="h-8 w-8 lg:h-12 lg:w-12 text-secondary-foreground" />
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-3">დაზღვევა</h3>
                    <p className="text-sm lg:text-base text-muted-foreground mb-6">
                      დააზღვიე ავტომობილი საუკეთესო პირობებით
                    </p>
                    <Button className="w-full bg-secondary hover:bg-secondary-dark text-secondary-foreground">
                      გაიგე მეტი
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Banner Section - Desktop */}
        <HomeCenterBanner />
      </main>

      <Footer />
      <MobileBanner />
      <MobileBottomNav />
      <EvacuatorDialog open={evacuatorDialogOpen} onOpenChange={setEvacuatorDialogOpen} />
    </div>;
};
export default Index;