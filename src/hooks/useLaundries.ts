import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Laundry = Database["public"]["Tables"]["laundries"]["Row"];
type LaundryInsert = Database["public"]["Tables"]["laundries"]["Insert"];
type LaundryUpdate = Database["public"]["Tables"]["laundries"]["Update"];

export const useLaundries = () => {
  return useQuery({
    queryKey: ["laundries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("laundries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching laundries:", error);
        throw error;
      }

      return data as Laundry[];
    },
  });
};

export const useCreateLaundry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (laundry: LaundryInsert) => {
      const { data, error } = await supabase
        .from("laundries")
        .insert(laundry)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laundries"] });
      toast.success("სამრეცხაო წარმატებით დაემატა");
    },
    onError: (error) => {
      console.error("Error creating laundry:", error);
      toast.error("სამრეცხაოს დამატება ვერ მოხერხდა");
    },
  });
};

export const useUpdateLaundry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: LaundryUpdate & { id: number }) => {
      const { data, error } = await supabase
        .from("laundries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laundries"] });
      toast.success("სამრეცხაო წარმატებით განახლდა");
    },
    onError: (error) => {
      console.error("Error updating laundry:", error);
      toast.error("სამრეცხაოს განახლება ვერ მოხერხდა");
    },
  });
};

export const useDeleteLaundry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("laundries")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laundries"] });
      toast.success("სამრეცხაო წარმატებით წაიშალა");
    },
    onError: (error) => {
      console.error("Error deleting laundry:", error);
      toast.error("სამრეცხაოს წაშლა ვერ მოხერხდა");
    },
  });
};