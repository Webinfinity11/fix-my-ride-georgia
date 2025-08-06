import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wrench, Car, Zap, Settings, Gauge, Paintbrush } from "lucide-react";
import { createCategorySlug } from "@/utils/slugUtils";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

type ServiceCategory = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
};

const getIcon = (iconName: string | null) => {
  switch (iconName) {
    case "engine":
      return <Settings className="h-12 w-12 text-primary" />;
    case "electric":
      return <Zap className="h-12 w-12 text-primary" />;
    case "suspension":
    case "brakes":
      return <Car className="h-12 w-12 text-primary" />;
    case "diagnostic":
      return <Gauge className="h-12 w-12 text-primary" />;
    case "paint":
      return <Paintbrush className="h-12 w-12 text-primary" />;
    default:
      return <Wrench className="h-12 w-12 text-primary" />;
  }
};

const CategoryList = () => {
  const navigate = useNavigate();
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

      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      toast.error("კატეგორიების ჩატვირთვისას შეცდომა დაფიქსირდა");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: ServiceCategory) => {
    const slug = createCategorySlug(category.name);
    navigate(`/category/${slug}`);
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
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded"></div>
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
      
      <main className="flex-grow">
        {/* Breadcrumb */}
        <div className="bg-muted py-4">
          <div className="container mx-auto px-4">
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
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold mb-4">სერვისის კატეგორიები</h1>
              <p className="text-lg text-muted-foreground mb-6">
                აირჩიეთ სასურველი კატეგორია და იპოვეთ საუკეთესო მექანიკოსები თქვენს ზონაში
              </p>
              <div className="text-sm text-muted-foreground">
                სულ {categories.length} კატეგორია
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="container mx-auto px-4 py-12">
          {categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category) => (
                <Card 
                  key={category.id} 
                  className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 bg-white border-2 hover:border-primary/30"
                  onClick={() => handleCategoryClick(category)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 flex justify-center">
                      {getIcon(category.icon)}
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">
                      {category.name}
                    </h3>
                    <p className="text-muted-foreground mb-4 text-sm">
                      {category.description || "პროფესიონალური სერვისი თქვენი ავტომობილისთვის"}
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full hover:bg-primary hover:text-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCategoryClick(category);
                      }}
                    >
                      სერვისების ნახვა
                    </Button>
                  </CardContent>
                </Card>
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