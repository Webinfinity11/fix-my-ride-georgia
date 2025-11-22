import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AutoLead {
  id: string;
  full_name: string;
  phone: string;
  comment: string | null;
  lead_type: string;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export const useAutoLeads = () => {
  return useQuery({
    queryKey: ["auto-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auto_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AutoLead[];
    },
  });
};

export const useUpdateLeadStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("auto_leads")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-leads"] });
      toast.success("სტატუსი წარმატებით განახლდა");
    },
    onError: (error) => {
      console.error("Error updating lead status:", error);
      toast.error("სტატუსის განახლება ვერ მოხერხდა");
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("auto_leads")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-leads"] });
      toast.success("ლიდი წარმატებით წაიშალა");
    },
    onError: (error) => {
      console.error("Error deleting lead:", error);
      toast.error("ლიდის წაშლა ვერ მოხერხდა");
    },
  });
};

export const useNewLeadsCount = () => {
  return useQuery({
    queryKey: ["new-leads-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("auto_leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "new");

      if (error) throw error;
      return count || 0;
    },
  });
};
