import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type FuelImporter = Database["public"]["Tables"]["fuel_importers"]["Row"];
type FuelImporterInsert = Database["public"]["Tables"]["fuel_importers"]["Insert"];
type FuelImporterUpdate = Database["public"]["Tables"]["fuel_importers"]["Update"];

export const useFuelImporters = () => {
  return useQuery({
    queryKey: ["fuel-importers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fuel_importers")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as FuelImporter[];
    },
  });
};

export const useCreateFuelImporter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newImporter: FuelImporterInsert) => {
      const { data, error } = await supabase
        .from("fuel_importers")
        .insert(newImporter)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-importers"] });
      toast.success("კომპანია წარმატებით დაემატა");
    },
    onError: (error) => {
      console.error("Error creating fuel importer:", error);
      toast.error("კომპანიის დამატებისას მოხდა შეცდომა");
    },
  });
};

export const useUpdateFuelImporter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: FuelImporterUpdate & { id: number }) => {
      const { data, error } = await supabase
        .from("fuel_importers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-importers"] });
      toast.success("კომპანია წარმატებით განახლდა");
    },
    onError: (error) => {
      console.error("Error updating fuel importer:", error);
      toast.error("კომპანიის განახლებისას მოხდა შეცდომა");
    },
  });
};

export const useDeleteFuelImporter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("fuel_importers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-importers"] });
      toast.success("კომპანია წარმატებით წაიშალა");
    },
    onError: (error) => {
      console.error("Error deleting fuel importer:", error);
      toast.error("კომპანიის წაშლისას მოხდა შეცდომა");
    },
  });
};
