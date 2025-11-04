import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FuelBrandStats {
  brand_id: string;
  brand_name: string;
  logo_url: string | null;
  vote_count: number;
  vote_percentage: number;
}

export const useFuelVoteStats = () => {
  return useQuery({
    queryKey: ["fuel-vote-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_fuel_brand_stats");

      if (error) throw error;
      return data as FuelBrandStats[];
    },
    refetchInterval: 10000,
  });
};
