
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

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch unique cities
      const { data: servicesData, error: servicesError } = await supabase
        .from("mechanic_services")
        .select("city")
        .not("city", "is", null);

      if (servicesError) throw servicesError;
      
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
        .not("district", "is", null);

      if (error) throw error;
      
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
      console.log("Fetching services with filters:", filters);
      
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
          service_categories!mechanic_services_category_id_fkey(id, name),
          profiles!mechanic_services_mechanic_id_fkey(
            id,
            first_name,
            last_name,
            mechanic_profiles(rating)
          )
        `)
        .eq("is_active", true);

      // Apply filters
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
        console.error("Supabase query error:", error);
        throw error;
      }

      console.log("Raw service data:", data);

      if (!data) {
        setServices([]);
        return;
      }

      let filteredServices = data.map(service => {
        // Handle profile data - it could be an array or single object
        const profile = Array.isArray(service.profiles) ? service.profiles[0] : service.profiles;
        const category = service.service_categories;
        
        return {
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
          category: category ? {
            id: category.id,
            name: category.name
          } : null,
          mechanic: {
            id: profile?.id || "",
            first_name: profile?.first_name || "",
            last_name: profile?.last_name || "",
            rating: profile?.mechanic_profiles?.rating || null,
          }
        };
      });

      // Filter by car brands
      if (filters.selectedBrands.length > 0) {
        filteredServices = filteredServices.filter(service => 
          service.car_brands && 
          filters.selectedBrands.some(brand => service.car_brands?.includes(brand))
        );
      }

      console.log("Processed services:", filteredServices);
      setServices(filteredServices);
    } catch (error: any) {
      console.error("Error fetching services:", error);
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
