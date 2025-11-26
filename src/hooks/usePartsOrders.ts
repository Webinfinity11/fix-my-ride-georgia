import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PartsOrder {
  id: string;
  full_name: string;
  phone: string;
  car_brand: string;
  car_model: string;
  car_year: string | null;
  engine_volume: string | null;
  part_name: string;
  part_description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const usePartsOrders = () => {
  return useQuery({
    queryKey: ["parts-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PartsOrder[];
    },
  });
};

export const useNewPartsOrdersCount = () => {
  return useQuery({
    queryKey: ["parts-orders-count", "new"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("parts_orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "new");

      if (error) throw error;
      return count || 0;
    },
  });
};

export const useCreatePartsOrder = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: Omit<PartsOrder, "id" | "created_at" | "updated_at" | "status">) => {
      const { data, error } = await supabase
        .from("parts_orders")
        .insert([order])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts-orders"] });
      queryClient.invalidateQueries({ queryKey: ["parts-orders-count"] });
      toast({
        title: "წარმატება",
        description: "თქვენი შეკვეთა წარმატებით გაიგზავნა",
      });
    },
    onError: (error) => {
      toast({
        title: "შეცდომა",
        description: "შეკვეთის გაგზავნისას მოხდა შეცდომა",
        variant: "destructive",
      });
      console.error("Error creating parts order:", error);
    },
  });
};

export const useUpdatePartsOrderStatus = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("parts_orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts-orders"] });
      queryClient.invalidateQueries({ queryKey: ["parts-orders-count"] });
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
      console.error("Error updating parts order status:", error);
    },
  });
};

export const useDeletePartsOrder = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("parts_orders")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts-orders"] });
      queryClient.invalidateQueries({ queryKey: ["parts-orders-count"] });
      toast({
        title: "წარმატება",
        description: "შეკვეთა წარმატებით წაიშალა",
      });
    },
    onError: (error) => {
      toast({
        title: "შეცდომა",
        description: "შეკვეთის წაშლისას მოხდა შეცდომა",
        variant: "destructive",
      });
      console.error("Error deleting parts order:", error);
    },
  });
};
