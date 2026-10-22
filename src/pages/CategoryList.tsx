import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { getCategoryImage } from "@/utils/categoryImages";
import { createCategorySlug } from "@/utils/slugUtils";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

type ServiceCategory = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
};

const CategoryList = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("name");

      if (error) throw error;

      const featuredOrder = [11, 15, 14, 17, 16, 20, 13, 25];
      setCategories([...(data || [])].sort((a, b) => {
        const aRank = featuredOrder.indexOf(a.id);
        const bRank = featuredOrder.indexOf(b.id);
        return (aRank === -1 ? featuredOrder.length : aRank)
          - (bRank === -1 ? featuredOrder.length : bRank);
      }));
    } catch (error: unknown) {
      console.error("Error fetching categories:", error);
      toast.error("კატეგორიების ჩატვირთვისას შეცდომა დაფიქსირდა");
    } finally {
      setLoading(false);
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "სერვისის კატეგორიები - FixUp.ge",
    description: "ყველა ავტოსერვისის კატეგორია ერთ ადგილას. აირჩიეთ სასურველი სერვისი და იპოვეთ საუკეთესო მექანიკოსები.",
    url: "https://fixup.ge/category",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: categories.map((category, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Service",
          name: category.name,
          description: category.description,
          url: `https://fixup.ge/category/${createCategorySlug(category.name)}`
        }
      }))
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container max-w-[1120px] mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-2xl"></div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="სერვისის კატეგორიები - FixUp.ge"
        description="ყველა ავტოსერვისის კატეგორია ერთ ადგილას. აირჩიეთ სასურველი სერვისი და იპოვეთ საუკეთესო მექანიკოსები."
        keywords="ავტოსერვისი, კატეგორიები, მექანიკოსი, ავტომობილის რემონტი, სერვისი, საქართველო"
        url="https://fixup.ge/category"
        structuredData={structuredData}
      />
      
      <Header />
      
      <main className="flex-grow bg-[#eef2f7] dark:bg-background">
        {/* Breadcrumb */}
        <div className="bg-muted py-4">
          <div className="container max-w-[1120px] mx-auto px-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">მთავარი</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>კატეგორიები</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Header Section */}
        <div className="pt-10 md:pt-14 pb-2">
          <div className="container max-w-[1120px] mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">რა გჭირდება?<span className="sr-only"> — ავტოსერვისის კატეგორიები საქართველოში</span></h1>
              <p className="text-lg text-muted-foreground mb-6">
                აირჩიეთ სასურველი სერვისი და იპოვეთ ავტოხელოსანი თქვენს უბანში.
              </p>
              <div className="text-sm text-muted-foreground">
                სულ {categories.length} კატეგორია
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="container max-w-[1120px] mx-auto px-4 pt-6 pb-12">
          {categories.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${createCategorySlug(category.name)}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 dark:border-border dark:bg-card dark:text-card-foreground"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#e1e9f1]">
                    <img
                      src={getCategoryImage(category.id)}
                      alt={category.name}
                      width={640}
                      height={480}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
                    />
                  </div>
                  <div className="flex items-end gap-2 p-3 md:p-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm md:text-base font-bold leading-snug">{category.name}</h2>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {category.description || "ხელოსნების ნახვა"}
                      </p>
                    </div>
                    <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 text-primary transition-transform motion-safe:group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">კატეგორიები ვერ მოიძებნა</h3>
              <p className="text-muted-foreground">
                კატეგორიების ჩატვირთვისას შეცდომა დაფიქსირდა. სცადეთ ხელახლა.
              </p>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CategoryList;