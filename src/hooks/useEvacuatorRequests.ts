import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EvacuatorRequest {
  id: string;
  full_name: string;
  phone: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useEvacuatorRequests = () => {
  return useQuery({
    queryKey: ["evacuator-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evacuation_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EvacuatorRequest[];
    },
  });
};

export const useNewEvacuatorRequestsCount = () => {
  return useQuery({
    queryKey: ["evacuator-requests-count", "new"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("evacuation_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "new");

      if (error) throw error;
      return count || 0;
    },
  });
};

export const useCreateEvacuatorRequest = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: { full_name: string; phone: string; description?: string }) => {
      const { error } = await supabase
        .from("evacuation_requests")
        .insert([request]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evacuator-requests"] });
      queryClient.invalidateQueries({ queryKey: ["evacuator-requests-count"] });
      toast({
        title: "წარმატება",
        description: "თქვენი მოთხოვნა წარმატებით გაიგზავნა",
      });
    },
    onError: (error) => {
      toast({
        title: "შეცდომა",
        description: "მოთხოვნის გაგზავნისას მოხდა შეცდომა",
        variant: "destructive",
      });
      console.error("Error creating evacuator request:", error);
    },
  });
};

export const useUpdateEvacuatorRequestStatus = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("evacuation_requests")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evacuator-requests"] });
      queryClient.invalidateQueries({ queryKey: ["evacuator-requests-count"] });
      toast({
        title: "წარმატება",
        description: "სტატუსი წარმატებით განახლდა",
      });
    },
    onError: (error) => {
      toast({
        title: "შეცდომა",
        description: "სტატუსის განახლებისას მოხდა შეცდომა",
        variant: "destructive",
      });
      console.error("Error updating evacuator request status:", error);
    },
  });
};

export const useDeleteEvacuatorRequest = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("evacuation_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evacuator-requests"] });
      queryClient.invalidateQueries({ queryKey: ["evacuator-requests-count"] });
      toast({
        title: "წარმატება",
        description: "მოთხოვნა წარმატებით წაიშალა",
      });
    },
    onError: (error) => {
      toast({
        title: "შეცდომა",
        description: "მოთხოვნის წაშლისას მოხდა შეცდომა",
        variant: "destructive",
      });
      console.error("Error deleting evacuator request:", error);
    },
  });
};
