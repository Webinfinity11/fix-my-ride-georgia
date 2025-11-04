import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FuelBrand {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export const useFuelBrands = () => {
  return useQuery({
    queryKey: ["fuel-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fuel_brands")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as FuelBrand[];
    },
  });
};
