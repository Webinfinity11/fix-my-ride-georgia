import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import ServiceCard from "@/components/services/ServiceCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { generateStructuredData } from "@/utils/seoUtils";
import { getCategoryFromSlug, createCategorySlug } from "@/utils/slugUtils";
import { ServiceType } from "@/hooks/useServices";

type CategoryType = {
  id: number;
  name: string;
  description: string;
  icon: string;
};

const ServiceCategory = () => {
  const { categoryId, categorySlug } = useParams<{ categoryId?: string; categorySlug?: string }>();
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    searchTerm: "",
    selectedCity: null as string | null,
    selectedDistrict: null as string | null,
    selectedBrands: [] as string[],
    onSiteOnly: false,
    minRating: null as number | null
  });

  useEffect(() => {
    const param = categoryId || categorySlug;
    if (param) {
      fetchCategoryAndServices();
    }
  }, [categoryId, categorySlug]);

  useEffect(() => {
    if (category) {
      fetchServicesWithFilters();
    }
  }, [filters, category]);

  const fetchCategoryAndServices = async () => {
    const param = categoryId || categorySlug;
    if (!param) return;

    try {
      setLoading(true);
      
      // Use slug utility to get category (supports both ID and slug)
      const categoryData = await getCategoryFromSlug(param);
      
      if (!categoryData) {
        throw new Error('Category not found');
      }
      
      setCategory(categoryData);

      // Fetch services for this category
      await fetchServicesWithFilters();
    } catch (error: any) {
      console.error("Error fetching category:", error);
      toast.error("კატეგორიის ჩატვირთვისას შეცდომა დაფიქსირდა");
    } finally {
      setLoading(false);
    }
  };

  const fetchServicesWithFilters = async () => {
    if (!category) return;

    try {
      let query = supabase
        .from("mechanic_services")
        .select(`
          *,
          category:service_categories(id, name),
          mechanic:profiles(
            id,
            first_name,
            last_name,
            phone
          )
        `)
        .eq("category_id", category.id)
        .eq("is_active", true);

      if (filters.selectedCity) {
        query = query.eq("city", filters.selectedCity);
      }

      if (filters.selectedDistrict) {
        query = query.eq("district", filters.selectedDistrict);
      }

      if (filters.onSiteOnly) {
        query = query.eq("on_site_service", true);
      }

      if (filters.minRating) {
        query = query.gte("rating", filters.minRating);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match ServiceType
      let filteredServices = (data || []).map(service => ({
        ...service,
        mechanic: {
          ...(Array.isArray(service.mechanic) ? service.mechanic[0] : service.mechanic),
          rating: service.rating || 0
        },
        category: service.category || { id: category.id, name: category.name }
      }));

      // Client-side filtering for search term
      if (filters.searchTerm) {
        filteredServices = filteredServices.filter(service =>
          service.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          service.description?.toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
      }

      // Client-side filtering for car brands
      if (filters.selectedBrands.length > 0) {
        filteredServices = filteredServices.filter(service =>
          service.car_brands?.some(brand =>
            filters.selectedBrands.includes(brand)
          )
        );
      }

      setServices(filteredServices);
    } catch (error: any) {
      console.error("Error fetching services:", error);
      toast.error("სერვისების ჩატვირთვისას შეცდომა დაფიქსირდა");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">კატეგორია ვერ მოიძებნა</h1>
          <Link to="/services" className="text-primary hover:underline">
            უკან სერვისებზე
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const structuredData = {
    ...generateStructuredData('Service', {
      name: category.name,
      description: category.description,
      category: category.name
    }),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${category.name} სერვისები`,
      itemListElement: services.map(service => ({
        '@type': 'Offer',
        name: service.name,
        description: service.description,
        price: service.price_from,
        priceCurrency: 'GEL'
      }))
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={`${category.name} - ავტოსერვისები`}
        description={`${category.description || `იპოვეთ საუკეთესო ${category.name} სერვისები საქართველოში. გამოცდილი მექანიკოსები, მაღალი ხარისხის მომსახურება.`}`}
        keywords={`${category.name}, ავტოსერვისი, მექანიკოსი, ავტომობილის რემონტი, საქართველო`}
        url={`https://fixup.ge/category/${createCategorySlug(category.name)}`}
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
                  <BreadcrumbLink href="/category">კატეგორიები</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{category.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Header Section */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold mb-4">{category.name}</h1>
              <p className="text-lg text-muted-foreground mb-6">
                {category.description || `იპოვეთ საუკეთესო ${category.name} სერვისები საქართველოში`}
              </p>
              <div className="text-sm text-muted-foreground">
                {services.length} სერვისი ამ კატეგორიაში
              </div>
            </div>
          </div>
        </div>

        {/* Simple filters for category page */}
        <div className="container mx-auto px-4 py-6">
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">ძებნა</Label>
                <Input
                  id="search"
                  placeholder="ძებნა სერვისებში..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="city">ქალაქი</Label>
                <Select value={filters.selectedCity || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, selectedCity: value === "all" ? null : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="აირჩიეთ ქალაქი" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ყველა ქალაქი</SelectItem>
                    <SelectItem value="თბილისი">თბილისი</SelectItem>
                    <SelectItem value="ბათუმი">ბათუმი</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="onsite"
                  checked={filters.onSiteOnly}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, onSiteOnly: checked as boolean }))}
                />
                <Label htmlFor="onsite">მხოლოდ ადგილზე სერვისი</Label>
              </div>
            </div>
          </Card>
        </div>

        {/* Services Grid */}
        <div className="container mx-auto px-4 pb-12">
          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">სერვისები ვერ მოიძებნა</h3>
              <p className="text-muted-foreground mb-4">
                შეცვალეთ ფილტრები ან სცადეთ სხვა კატეგორია
              </p>
              <Link to="/services" className="text-primary hover:underline">
                ყველა სერვისის ნახვა
              </Link>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ServiceCategory;