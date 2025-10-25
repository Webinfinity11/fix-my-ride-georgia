import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ServiceType = {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  estimated_hours: number | null;
  city: string | null;
  district: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  car_brands: string[] | null;
  on_site_service: boolean;
  accepts_card_payment: boolean;
  accepts_cash_payment: boolean;
  rating: number | null;
  review_count: number | null;
  photos: string[] | null;
  category: {
    id: number;
    name: string;
  } | null;
  mechanic: {
    id: string;
    display_id?: number;
    first_name: string;
    last_name: string;
    rating: number | null;
    phone: string | null;
  };
  created_at?: string;
};

export type ServiceCategory = {
  id: number;
  name: string;
};

export const useServices = () => {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("service_categories")
        .select("id, name")
        .order("name", { ascending: true });

      if (categoriesError) throw categoriesError;
      
      setCategories(categoriesData || []);

      // Fetch unique cities
      const { data: servicesData, error: servicesError } = await supabase
        .from("mechanic_services")
        .select("city")
        .not("city", "is", null)
        .eq("is_active", true)
        .limit(100);

      if (!servicesError && servicesData) {
        const uniqueCities = Array.from(
          new Set(servicesData.map(s => s.city).filter(Boolean) as string[])
        ).sort();
        setCities(uniqueCities);
      }

    } catch (error: any) {
      toast.error("მონაცემების ჩატვირთვისას შეცდომა დაფიქსირდა");
    }
  };

  const fetchDistricts = async (city: string) => {
    try {
      const { data, error } = await supabase
        .from("mechanic_services")
        .select("district")
        .eq("city", city)
        .eq("is_active", true)
        .not("district", "is", null)
        .limit(50);

      if (error) return;
      
      const uniqueDistricts = Array.from(
        new Set(data?.map(s => s.district).filter(Boolean) as string[])
      ).sort();
      setDistricts(uniqueDistricts);
    } catch (error: any) {
      // Silent fail
    }
  };

  const fetchServices = async (filters: {
    searchTerm: string;
    selectedCategory: number | "all";
    selectedCity: string | null;
    selectedDistrict: string | null;
    selectedBrands: string[];
    onSiteOnly: boolean;
    minRating: number | null;
  }) => {
    setLoading(true);
    
    try {
      let query = supabase
        .from("mechanic_services")
        .select(`
          id,
          name,
          slug,
          description,
          price_from,
          price_to,
          estimated_hours,
          city,
          district,
          address,
          latitude,
          longitude,
          car_brands,
          on_site_service,
          accepts_card_payment,
          accepts_cash_payment,
          rating,
          review_count,
          photos,
          category_id,
          mechanic_id,
          created_at,
          service_categories(id, name),
          profiles!inner(
            id,
            first_name,
            last_name,
            phone,
            mechanic_profiles(display_id, rating)
          )
        `)
        .eq("is_active", true)
        .limit(200);

      // Apply filters
      if (filters.selectedCategory && filters.selectedCategory !== "all") {
        query = query.eq("category_id", filters.selectedCategory);
      }

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

      const { data: servicesData, error: servicesError } = await query.order("created_at", { ascending: false });

      if (servicesError) throw servicesError;

      if (!servicesData) {
        setServices([]);
        return;
      }

      // Transform the data with nested relations
      let transformedServices: ServiceType[] = servicesData.map((service: any) => {
        const mechanic = Array.isArray(service.profiles) 
          ? service.profiles[0] 
          : service.profiles;
        
        const mechanicProfile = Array.isArray(mechanic?.mechanic_profiles) 
          ? mechanic.mechanic_profiles[0] 
          : mechanic?.mechanic_profiles;

        const category = Array.isArray(service.service_categories) 
          ? service.service_categories[0] 
          : service.service_categories;

        return {
          id: service.id,
          name: service.name || "უცნობი სერვისი",
          slug: service.slug,
          description: service.description,
          price_from: service.price_from,
          price_to: service.price_to,
          estimated_hours: service.estimated_hours,
          city: service.city,
          district: service.district,
          address: service.address,
          latitude: service.latitude,
          longitude: service.longitude,
          car_brands: service.car_brands,
          on_site_service: service.on_site_service || false,
          accepts_card_payment: service.accepts_card_payment || false,
          accepts_cash_payment: service.accepts_cash_payment || true,
          rating: service.rating,
          review_count: service.review_count,
          photos: service.photos || [],
          created_at: service.created_at,
          category: category ? {
            id: category.id,
            name: category.name
          } : null,
          mechanic: {
            id: mechanic?.id || "",
            display_id: mechanicProfile?.display_id || undefined,
            first_name: mechanic?.first_name || "",
            last_name: mechanic?.last_name || "",
            rating: mechanicProfile?.rating || null,
            phone: mechanic?.phone || null,
          }
        };
      });

      // Client-side search filtering
      if (filters.searchTerm && filters.searchTerm.trim()) {
        const searchLower = filters.searchTerm.toLowerCase().trim();
        
        transformedServices = transformedServices.filter(service => {
          const nameMatch = service.name?.toLowerCase().includes(searchLower);
          const descriptionMatch = service.description?.toLowerCase().includes(searchLower);
          const categoryMatch = service.category?.name?.toLowerCase().includes(searchLower);
          const mechanicFirstNameMatch = service.mechanic.first_name?.toLowerCase().includes(searchLower);
          const mechanicLastNameMatch = service.mechanic.last_name?.toLowerCase().includes(searchLower);
          const phoneMatch = service.mechanic.phone?.replace(/[\s\-\(\)]/g, '').includes(searchLower.replace(/[\s\-\(\)]/g, ''));
          const carBrandMatch = service.car_brands?.some(brand => brand.toLowerCase().includes(searchLower));
          
          return nameMatch || descriptionMatch || categoryMatch || mechanicFirstNameMatch || mechanicLastNameMatch || phoneMatch || carBrandMatch;
        });
      }

      // Filter by car brands
      if (filters.selectedBrands.length > 0) {
        const popularBrands = ["BMW", "Mercedes-Benz", "Audi", "Toyota", "Honda", "Nissan", "Hyundai", 
          "Kia", "Volkswagen", "Ford", "Chevrolet", "Mazda", "Subaru", "Lexus",
          "Infiniti", "Acura", "Jeep", "Land Rover", "Porsche"];

        transformedServices = transformedServices.filter(service => 
          service.car_brands && 
          filters.selectedBrands.some(brand => 
            service.car_brands?.includes(brand) || 
            (brand === "სხვა" && service.car_brands?.some(b => 
              !popularBrands.includes(b)
            ))
          )
        );
      }

      setServices(transformedServices);
      
    } catch (error: any) {
      console.error("Services fetch error:", error);
      
      if (error.message?.includes('Failed to fetch')) {
        toast.error("ინტერნეტ კავშირი არ არის. გთხოვთ შეამოწმოთ ქსელი");
      } else if (error.code === 'PGRST116') {
        toast.error("სერვისები დროებით მიუწვდომელია");
      } else {
        toast.error("სერვისების ჩატვირთვისას შეცდომა დაფიქსირდა");
      }
      
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    services,
    categories,
    cities,
    districts,
    loading,
    fetchInitialData,
    fetchDistricts,
    fetchServices,
  };
};