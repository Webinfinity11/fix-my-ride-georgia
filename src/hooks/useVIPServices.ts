import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VIPService {
  id: number;
  name: string;
  slug?: string | null;
  description: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  car_brands: string[] | null;
  on_site_service: boolean;
  accepts_card_payment: boolean;
  accepts_cash_payment: boolean;
  rating: number | null;
  review_count: number | null;
  photos: string[] | null;
  vip_status: "super_vip" | "vip" | null;
  vip_until: string | null;
  is_vip_active: boolean;
  estimated_hours: number | null;
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
    phone_number?: string | null;
  };
}

export const useVIPServices = (limit: number = 10) => {
  const [services, setServices] = useState<VIPService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVIPServices = async () => {
      try {
        setLoading(true);

        const { data, error: fetchError } = await supabase
          .from("mechanic_services")
          .select(`
            id,
            name,
            slug,
            description,
            city,
            district,
            address,
            car_brands,
            on_site_service,
            accepts_card_payment,
            accepts_cash_payment,
            rating,
            review_count,
            photos,
            vip_status,
            vip_until,
            is_vip_active,
            estimated_hours,
            category_id,
            mechanic_id,
            service_categories!mechanic_services_category_id_fkey (
              id,
              name
            ),
            profiles!fk_mechanic_services_profiles (
              id,
              first_name,
              last_name,
              phone
            ),
            mechanic_profiles!mechanic_services_mechanic_id_fkey (
              display_id,
              rating
            )
          `)
          .eq("is_vip_active", true)
          .eq("is_active", true)
          .not("vip_status", "is", null)
          .order("vip_status", { ascending: true }) // super_vip comes before vip alphabetically
          .limit(limit);

        if (fetchError) throw fetchError;

        // Transform data to match expected format
        const transformedData: VIPService[] = (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          city: item.city,
          district: item.district,
          address: item.address,
          car_brands: item.car_brands,
          on_site_service: item.on_site_service || false,
          accepts_card_payment: item.accepts_card_payment || false,
          accepts_cash_payment: item.accepts_cash_payment || false,
          rating: item.rating,
          review_count: item.review_count,
          photos: item.photos,
          vip_status: item.vip_status,
          vip_until: item.vip_until,
          is_vip_active: item.is_vip_active || false,
          estimated_hours: item.estimated_hours,
          category: item.service_categories
            ? {
                id: item.service_categories.id,
                name: item.service_categories.name,
              }
            : null,
          mechanic: {
            id: item.profiles?.id || item.mechanic_id,
            display_id: item.mechanic_profiles?.display_id,
            first_name: item.profiles?.first_name || "უცნობი",
            last_name: item.profiles?.last_name || "",
            rating: item.mechanic_profiles?.rating || null,
            phone_number: item.profiles?.phone || null,
          },
        }));

        // Sort super_vip first
        const sortedData = transformedData.sort((a, b) => {
          if (a.vip_status === "super_vip" && b.vip_status !== "super_vip") return -1;
          if (a.vip_status !== "super_vip" && b.vip_status === "super_vip") return 1;
          return 0;
        });

        setServices(sortedData);
      } catch (err: any) {
        console.error("Error fetching VIP services:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVIPServices();
  }, [limit]);

  return { services, loading, error };
};
