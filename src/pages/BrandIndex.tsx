import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { BrandsNav } from "@/components/seo/BrandsNav";

/** Hub page listing every brand landing page — internal-link equity + entry point. */
const BrandIndex = () => {
  const canonical = "https://fixup.ge/brand";
  const breadcrumbItems = [
    { name: "მთავარი", url: "https://fixup.ge/" },
    { name: "მარკები", url: canonical },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="ავტოსერვისი მარკის მიხედვით — მანქანის ბრენდები | FixUp"
        description="იპოვე ავტოხელოსანი მანქანის მარკის მიხედვით — Ford, Toyota, Mercedes-Benz, BMW და სხვა. ვერიფიცირებული სპეციალისტები, ფასები და ონლაინ ჯავშანი FixUp-ზე."
        canonical={canonical}
      />
      <BreadcrumbSchema items={breadcrumbItems} />
      <Header />

      <main className="flex-grow">
        <div className="bg-muted py-4">
          <div className="container mx-auto px-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">მთავარი</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>მარკები</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary/5 to-primary/10 py-12">
          <div className="container mx-auto px-4 text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              ავტოსერვისი მარკის მიხედვით
            </h1>
            <p className="text-lg text-muted-foreground">
              აირჩიე მანქანის მარკა და იპოვე ხელოსანი, რომელიც სწორედ მასზე სპეციალიზდება.
            </p>
          </div>
        </div>

        <BrandsNav heading="აირჩიე მარკა" />
      </main>

      <Footer />
    </div>
  );
};

export default BrandIndex;
