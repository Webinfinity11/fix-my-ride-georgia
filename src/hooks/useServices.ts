import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ServiceType = {
  id: number;
  name: string;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  estimated_hours: number | null;
  city: string | null;
  district: string | null;
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
    first_name: string;
    last_name: string;
    rating: number | null;
  };
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

      if (categoriesError) {
        console.error("Categories error:", categoriesError);
        throw categoriesError;
      }
      
      setCategories(categoriesData || []);

      // Fetch unique cities - with better error handling
      const { data: servicesData, error: servicesError } = await supabase
        .from("mechanic_services")
        .select("city")
        .not("city", "is", null)
        .eq("is_active", true);

      if (servicesError) {
        console.error("Cities error:", servicesError);
        // Don't throw here, just log and continue
      }
      
      const uniqueCities = Array.from(
        new Set(servicesData?.map(s => s.city).filter(Boolean) as string[])
      ).sort();
      setCities(uniqueCities);

    } catch (error: any) {
      console.error("Error fetching initial data:", error);
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
        .not("district", "is", null);

      if (error) {
        console.error("Districts error:", error);
        return;
      }
      
      const uniqueDistricts = Array.from(
        new Set(data?.map(s => s.district).filter(Boolean) as string[])
      ).sort();
      setDistricts(uniqueDistricts);
    } catch (error: any) {
      console.error("Error fetching districts:", error);
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
      console.log("🔍 Fetching services with filters:", filters);
      
      // Single query approach with proper joins
      let query = supabase
        .from("mechanic_services")
        .select(`
          id,
          name,
          description,
          price_from,
          price_to,
          estimated_hours,
          city,
          district,
          car_brands,
          on_site_service,
          accepts_card_payment,
          accepts_cash_payment,
          rating,
          review_count,
          photos,
          service_categories!inner(id, name),
          profiles!inner(
            id,
            first_name,
            last_name,
            mechanic_profiles(rating)
          )
        `)
        .eq("is_active", true);

      // Apply filters step by step
      if (filters.searchTerm && filters.searchTerm.trim()) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

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

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Supabase query error:", error);
        
        // Fallback to simple query if complex join fails
        console.log("🔄 Trying fallback query...");
        const fallbackQuery = await supabase
          .from("mechanic_services")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });
          
        if (fallbackQuery.error) {
          throw fallbackQuery.error;
        }
        
        // Process fallback data without joins
        const fallbackServices = fallbackQuery.data?.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description,
          price_from: service.price_from,
          price_to: service.price_to,
          estimated_hours: service.estimated_hours,
          city: service.city,
          district: service.district,
          car_brands: service.car_brands,
          on_site_service: service.on_site_service,
          accepts_card_payment: service.accepts_card_payment,
          accepts_cash_payment: service.accepts_cash_payment,
          rating: service.rating,
          review_count: service.review_count,
          category: null, // Will be null in fallback
          mechanic: {
            id: "",
            first_name: "სერვისი",
            last_name: "",
            rating: null,
          }
        })) || [];
        
        setServices(fallbackServices);
        return;
      }

      console.log("✅ Raw service data:", data);

      if (!data) {
        setServices([]);
        return;
      }

      // Transform data with safe property access
      let transformedServices: ServiceType[] = data.map(service => {
        // Safely access nested properties
        const profiles = service.profiles;
        const profile = Array.isArray(profiles) ? profiles[0] : profiles;
        
        const categories = service.service_categories;
        const category = Array.isArray(categories) ? categories[0] : categories;
        
        const mechanicProfiles = profile?.mechanic_profiles;
        const mechanicProfile = Array.isArray(mechanicProfiles) 
          ? mechanicProfiles[0] 
          : mechanicProfiles;

        return {
          id: service.id,
          name: service.name || "უცნობი სერვისი",
          description: service.description,
          price_from: service.price_from,
          price_to: service.price_to,
          estimated_hours: service.estimated_hours,
          city: service.city,
          district: service.district,
          car_brands: service.car_brands,
          on_site_service: service.on_site_service || false,
          accepts_card_payment: service.accepts_card_payment || false,
          accepts_cash_payment: service.accepts_cash_payment || true,
          rating: service.rating,
          review_count: service.review_count,
          photos: service.photos,
          category: category ? {
            id: category.id,
            name: category.name
          } : null,
          mechanic: {
            id: profile?.id || "",
            first_name: profile?.first_name || "",
            last_name: profile?.last_name || "",
            rating: mechanicProfile?.rating || null,
          }
        };
      });

      // Filter by car brands (client-side filtering)
      if (filters.selectedBrands.length > 0) {
        transformedServices = transformedServices.filter(service => 
          service.car_brands && 
          filters.selectedBrands.some(brand => 
            service.car_brands?.includes(brand) || 
            (brand === "სხვა" && service.car_brands?.some(b => 
              !["BMW", "Mercedes-Benz", "Audi", "Toyota", "Honda", "Nissan", "Hyundai", 
                "Kia", "Volkswagen", "Ford", "Chevrolet", "Mazda", "Subaru", "Lexus",
                "Infiniti", "Acura", "Jeep", "Land Rover", "Porsche"].includes(b)
            ))
          )
        );
      }

      console.log("✅ Final processed services:", transformedServices);
      setServices(transformedServices);
      
    } catch (error: any) {
      console.error("❌ Error fetching services:", error);
      toast.error("სერვისების ჩატვირთვისას შეცდომა დაფიქსირდა");
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