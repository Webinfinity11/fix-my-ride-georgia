
import { useState, useEffect } from "react";
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
  vip_status: 'vip' | 'super_vip' | null;
  vip_until: string | null;
  is_vip_active: boolean;
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
    console.log("🔄 Fetching initial data...");
    try {
      // Fetch categories
      console.log("📂 Fetching categories...");
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("service_categories")
        .select("id, name")
        .order("name", { ascending: true });

      if (categoriesError) {
        console.error("❌ Categories error:", categoriesError);
        throw categoriesError;
      }
      
      console.log("✅ Categories fetched:", categoriesData);
      setCategories(categoriesData || []);

      // Fetch unique cities
      console.log("🏙️ Fetching cities...");
      const { data: servicesData, error: servicesError } = await supabase
        .from("mechanic_services")
        .select("city")
        .not("city", "is", null)
        .eq("is_active", true);

      if (servicesError) {
        console.error("❌ Cities error:", servicesError);
        // Don't throw here, just log and continue
      } else {
        const uniqueCities = Array.from(
          new Set(servicesData?.map(s => s.city).filter(Boolean) as string[])
        ).sort();
        console.log("✅ Cities fetched:", uniqueCities);
        setCities(uniqueCities);
      }

    } catch (error: any) {
      console.error("❌ Error fetching initial data:", error);
      toast.error("მონაცემების ჩატვირთვისას შეცდომა დაფიქსირდა");
    }
  };

  const fetchDistricts = async (city: string) => {
    console.log("🏘️ Fetching districts for city:", city);
    try {
      const { data, error } = await supabase
        .from("mechanic_services")
        .select("district")
        .eq("city", city)
        .eq("is_active", true)
        .not("district", "is", null);

      if (error) {
        console.error("❌ Districts error:", error);
        return;
      }
      
      const uniqueDistricts = Array.from(
        new Set(data?.map(s => s.district).filter(Boolean) as string[])
      ).sort();
      console.log("✅ Districts fetched:", uniqueDistricts);
      setDistricts(uniqueDistricts);
    } catch (error: any) {
      console.error("❌ Error fetching districts:", error);
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
    console.log("🔍 Starting fetchServices with filters:", filters);
    setLoading(true);
    
    try {
      console.log("🚀 Attempting main query...");
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
          vip_status,
          vip_until,
          is_vip_active,
          service_categories(id, name)
        `)
        .eq("is_active", true);

      // Enhanced search - Apply search term filtering only if provided
      if (filters.searchTerm && filters.searchTerm.trim()) {
        console.log("🔎 Applying enhanced search term:", filters.searchTerm);
        // We'll do the enhanced search client-side to include categories and mechanic data
      }

      // Apply other filters
      if (filters.selectedCategory && filters.selectedCategory !== "all") {
        console.log("📂 Applying category filter:", filters.selectedCategory);
        query = query.eq("category_id", filters.selectedCategory);
      }

      if (filters.selectedCity) {
        console.log("🏙️ Applying city filter:", filters.selectedCity);
        query = query.eq("city", filters.selectedCity);
      }

      if (filters.selectedDistrict) {
        console.log("🏘️ Applying district filter:", filters.selectedDistrict);
        query = query.eq("district", filters.selectedDistrict);
      }

      if (filters.onSiteOnly) {
        console.log("🚗 Applying on-site filter");
        query = query.eq("on_site_service", true);
      }

      if (filters.minRating) {
        console.log("⭐ Applying rating filter:", filters.minRating);
        query = query.gte("rating", filters.minRating);
      }

      const { data: servicesData, error: servicesError } = await query.order("created_at", { ascending: false });

      if (servicesError) {
        console.error("❌ Main query failed:", servicesError);
        throw servicesError;
      }

      console.log("✅ Raw services data:", servicesData);

      if (!servicesData) {
        console.log("⚠️ No services data returned");
        setServices([]);
        return;
      }

      // Now fetch mechanic profiles separately
      console.log("👨‍🔧 Fetching mechanic profiles...");
      const mechanicIds = [...new Set(servicesData.map(s => s.mechanic_id))];
      
      const { data: mechanicsData, error: mechanicsError } = await supabase
        .from("profiles")
        .select(`
          id,
          first_name,
          last_name,
          phone,
          mechanic_profiles(display_id, rating)
        `)
        .in("id", mechanicIds);

      if (mechanicsError) {
        console.error("❌ Mechanics query failed:", mechanicsError);
      }

      console.log("✅ Mechanics data:", mechanicsData);

      // Transform the data
      let transformedServices: ServiceType[] = servicesData.map(service => {
        const mechanic = mechanicsData?.find(m => m.id === service.mechanic_id);
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
          vip_status: service.vip_status || null,
          vip_until: service.vip_until || null,
          is_vip_active: service.is_vip_active || false,
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

      // Enhanced client-side search filtering
      if (filters.searchTerm && filters.searchTerm.trim()) {
        const searchLower = filters.searchTerm.toLowerCase().trim();
        console.log("🔍 Applying enhanced client-side search for:", searchLower);
        
        transformedServices = transformedServices.filter(service => {
          // Search in service name
          const nameMatch = service.name?.toLowerCase().includes(searchLower);
          
          // Search in service description
          const descriptionMatch = service.description?.toLowerCase().includes(searchLower);
          
          // Search in category name
          const categoryMatch = service.category?.name?.toLowerCase().includes(searchLower);
          
          // Search in mechanic first name
          const mechanicFirstNameMatch = service.mechanic.first_name?.toLowerCase().includes(searchLower);
          
          // Search in mechanic last name
          const mechanicLastNameMatch = service.mechanic.last_name?.toLowerCase().includes(searchLower);
          
          // Search in mechanic phone (remove spaces and special characters for phone search)
          const phoneMatch = service.mechanic.phone?.replace(/[\s\-\(\)]/g, '').includes(searchLower.replace(/[\s\-\(\)]/g, ''));
          
          // Search in car brands
          const carBrandMatch = service.car_brands?.some(brand => brand.toLowerCase().includes(searchLower));
          
          return nameMatch || descriptionMatch || categoryMatch || mechanicFirstNameMatch || mechanicLastNameMatch || phoneMatch || carBrandMatch;
        });
        
        console.log("✅ Enhanced search results:", transformedServices.length);
      }

      // Filter by car brands (client-side filtering)
      if (filters.selectedBrands.length > 0) {
        console.log("🚗 Applying brand filters:", filters.selectedBrands);
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

      // Sort services: Super VIP > VIP > Regular (each sorted by rating)
      transformedServices.sort((a, b) => {
        // First, sort by VIP status
        if (a.vip_status === 'super_vip' && b.vip_status !== 'super_vip') return -1;
        if (a.vip_status !== 'super_vip' && b.vip_status === 'super_vip') return 1;
        if (a.vip_status === 'vip' && !b.vip_status) return -1;
        if (!a.vip_status && b.vip_status === 'vip') return 1;
        
        // Within same VIP tier, sort by rating
        const aRating = a.rating || 0;
        const bRating = b.rating || 0;
        return bRating - aRating;
      });

      console.log("✅ Final transformed and sorted services:", transformedServices);
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
