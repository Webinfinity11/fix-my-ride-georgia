import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useNewVipLeadsCount = (enabled: boolean) =>
  useQuery({
    queryKey: ["vip-leads-new-count"],
    enabled,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("vip_leads").select("id", { count: "exact", head: true }).eq("status", "new");
      if (error) throw error;
      return count ?? 0;
    },
  });
