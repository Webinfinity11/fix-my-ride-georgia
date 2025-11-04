import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useUserVote = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: userVote } = useQuery({
    queryKey: ["user-vote", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .rpc("get_user_vote", { p_user_id: userId });

      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!userId,
  });

  const voteMutation = useMutation({
    mutationFn: async (brandId: string) => {
      if (!userId) throw new Error("Authentication required");

      await supabase
        .from("fuel_votes")
        .delete()
        .eq("user_id", userId);

      const { error } = await supabase
        .from("fuel_votes")
        .insert({ user_id: userId, brand_id: brandId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-vote-stats"] });
      queryClient.invalidateQueries({ queryKey: ["user-vote", userId] });
      toast.success("თქვენი ხმა წარმატებით დაფიქსირდა!");
    },
    onError: (error) => {
      console.error("Vote error:", error);
      toast.error("ხმის მიცემა ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.");
    },
  });

  return {
    userVote,
    hasVoted: !!userVote,
    voteMutation,
  };
};
