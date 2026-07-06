
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
  created_at?: string;
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
    phone_number: string | null;
  };
};

export type ServiceCategory = {
  id: number;
  name: string;
};

export type ServiceSortOption =
  | "newest"
  | "oldest"
  | "price_low"
  | "price_high"
  | "rating"
  | "popular";

export type ServiceFilters = {
  searchTerm: string;
  selectedCategory: number | "all";
  selectedCity: string | null;
  selectedDistrict: string | null;
  selectedBrands: string[];
  onSiteOnly: boolean;
  minRating: number | null;
  sortBy?: ServiceSortOption;
};

const PAGE_SIZE = 24;

// Chosen sort → (column, ascending). VIP tier always ranks above these.
const SORT_MAP: Record<ServiceSortOption, [string, boolean]> = {
  newest: ["created_at", false],
  oldest: ["created_at", true],
  price_low: ["price_from", true],
  price_high: ["price_to", false],
  rating: ["rating", false],
  popular: ["review_count", false],
};

export const useServices = () => {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

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

  // Server-side paginated fetch. Previously this pulled EVERY active service
  // (~1MB) so text search / brand filter / VIP sort could run client-side;
  // that's now all done in the query and only one page (PAGE_SIZE) is fetched.
  // `page` 0 replaces the list; higher pages append ("load more").
  const fetchServices = async (filters: ServiceFilters, page = 0) => {
    if (page === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      let query = (supabase as any)
        .from("mechanic_services")
        .select(
          `
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
          created_at,
          service_categories(id, name)
        `,
          { count: "exact" },
        )
        .eq("is_active", true);

      // Structured filters
      if (filters.selectedCategory && filters.selectedCategory !== "all") {
        query = query.eq("category_id", filters.selectedCategory);
      }
      if (filters.selectedCity) query = query.eq("city", filters.selectedCity);
      if (filters.selectedDistrict) query = query.eq("district", filters.selectedDistrict);
      if (filters.onSiteOnly) query = query.eq("on_site_service", true);
      if (filters.minRating) query = query.gte("rating", filters.minRating);

      // Brand filter — server-side overlap for specific brands. The "სხვა"
      // (other = any brand not in the popular list) option can't be expressed
      // as a single PostgREST filter, so when it's the ONLY selection we don't
      // constrain by brand (rare).
      const specificBrands = filters.selectedBrands.filter((b) => b !== "სხვა");
      if (specificBrands.length > 0) {
        query = query.overlaps("car_brands", specificBrands);
      }

      // Text search — service name + description, plus any category whose name
      // matches (categories are already loaded in state). Strip characters that
      // would break PostgREST's or() filter grammar.
      const term = filters.searchTerm?.trim();
      if (term) {
        const safe = term.replace(/[,()]/g, " ").trim();
        const matchingCatIds = categories
          .filter((c) => c.name.toLowerCase().includes(safe.toLowerCase()))
          .map((c) => c.id);
        const ors = [`name.ilike.%${safe}%`, `description.ilike.%${safe}%`];
        if (matchingCatIds.length > 0) ors.push(`category_id.in.(${matchingCatIds.join(",")})`);
        query = query.or(ors.join(","));
      }

      // Ordering: active VIP first (super_vip → vip → none), then chosen sort.
      // is_vip_active is maintained by the daily expire_vip_services cron.
      const [sortCol, sortAsc] = SORT_MAP[filters.sortBy ?? "newest"];
      query = query
        .order("is_vip_active", { ascending: false, nullsFirst: false })
        .order("vip_status", { ascending: true, nullsFirst: false })
        .order(sortCol, { ascending: sortAsc, nullsFirst: false });

      // Pagination
      const from = page * PAGE_SIZE;
      query = query.range(from, from + PAGE_SIZE - 1);

      const { data: servicesData, error: servicesError, count } = await query;
      if (servicesError) throw servicesError;

      const rows = (servicesData ?? []) as any[];

      // Fetch mechanic profiles for THIS page only (cheap — <= PAGE_SIZE ids).
      const mechanicIds = [...new Set(rows.map((s) => s.mechanic_id))] as string[];
      let mechanicsData: any[] = [];
      if (mechanicIds.length > 0) {
        const { data: md, error: mechanicsError } = await supabase
          .from("profiles")
          .select(`id, first_name, last_name, phone, mechanic_profiles(display_id, rating)`)
          .in("id", mechanicIds);
        if (mechanicsError) console.error("Mechanics query failed:", mechanicsError);
        mechanicsData = md ?? [];
      }

      // Transform the data
      let transformedServices: ServiceType[] = rows.map((service) => {
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
          vip_status: (service as any).vip_status || null,
          vip_until: (service as any).vip_until || null,
          is_vip_active: (service as any).is_vip_active || false,
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
            phone_number: mechanic?.phone || null,
          }
        };
      });

      // Check for expired VIP on client-side
      transformedServices = transformedServices.map(service => {
        if (service.vip_until && service.is_vip_active) {
          const expirationDate = new Date(service.vip_until);
          const now = new Date();
          
          if (expirationDate < now) {
            // VIP expired - mark as inactive
            return {
              ...service,
              is_vip_active: false,
            };
          }
        }
        
        return service;
      });

      setTotalCount(count ?? 0);
      setHasMore(from + rows.length < (count ?? 0));
      setServices((prev) =>
        page === 0 ? transformedServices : [...prev, ...transformedServices],
      );
    } catch (error: any) {
      console.error("Error fetching services:", error);
      toast.error("სერვისების ჩატვირთვისას შეცდომა დაფიქსირდა");
      if (page === 0) setServices([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  return {
    services,
    categories,
    cities,
    districts,
    loading,
    loadingMore,
    totalCount,
    hasMore,
    fetchInitialData,
    fetchDistricts,
    fetchServices,
  };
};
