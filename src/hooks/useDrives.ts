import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Drive = Database["public"]["Tables"]["drives"]["Row"];
type DriveInsert = Database["public"]["Tables"]["drives"]["Insert"];
type DriveUpdate = Database["public"]["Tables"]["drives"]["Update"];

export const useDrives = () => {
  return useQuery({
    queryKey: ["drives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drives")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching drives:", error);
        throw error;
      }

      return data as Drive[];
    },
  });
};

export const useCreateDrive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (drive: DriveInsert) => {
      const { data, error } = await supabase
        .from("drives")
        .insert(drive)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drives"] });
      toast.success("დრაივი წარმატებით დაემატა");
    },
    onError: (error) => {
      console.error("Error creating drive:", error);
      toast.error("დრაივის დამატება ვერ მოხერხდა");
    },
  });
};

export const useUpdateDrive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: DriveUpdate & { id: number }) => {
      const { data, error } = await supabase
        .from("drives")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drives"] });
      toast.success("დრაივი წარმატებით განახლდა");
    },
    onError: (error) => {
      console.error("Error updating drive:", error);
      toast.error("დრაივის განახლება ვერ მოხერხდა");
    },
  });
};

export const useDeleteDrive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("drives")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drives"] });
      toast.success("დრაივი წარმატებით წაიშალა");
    },
    onError: (error) => {
      console.error("Error deleting drive:", error);
      toast.error("დრაივის წაშლა ვერ მოხერხდა");
    },
  });
};
