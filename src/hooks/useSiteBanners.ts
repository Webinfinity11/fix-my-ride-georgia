import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SiteBanner = {
  id: string;
  position: 'home_center_desktop' | 'home_above_mobile_nav';
  banner_url: string;
  link_url?: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

// Fetch all banners (for admin)
export const useSiteBanners = () => {
  return useQuery({
    queryKey: ["site-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_banners")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as SiteBanner[];
    },
  });
};

// Fetch active banner by position (for public display)
export const useActiveBanner = (position: 'home_center_desktop' | 'home_above_mobile_nav') => {
  return useQuery({
    queryKey: ["active-banner", position],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_banners")
        .select("*")
        .eq("position", position)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as SiteBanner | null;
    },
  });
};

// Create banner
export const useCreateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newBanner: Omit<SiteBanner, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("site_banners")
        .insert({
          ...newBanner,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-banners"] });
      queryClient.invalidateQueries({ queryKey: ["active-banner"] });
      toast.success("ბანერი წარმატებით დაემატა");
    },
    onError: (error) => {
      console.error("Error creating banner:", error);
      toast.error("ბანერის დამატებისას მოხდა შეცდომა");
    },
  });
};

// Update banner
export const useUpdateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SiteBanner> & { id: string }) => {
      const { data, error } = await supabase
        .from("site_banners")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-banners"] });
      queryClient.invalidateQueries({ queryKey: ["active-banner"] });
      toast.success("ბანერი წარმატებით განახლდა");
    },
    onError: (error) => {
      console.error("Error updating banner:", error);
      toast.error("ბანერის განახლებისას მოხდა შეცდომა");
    },
  });
};

// Delete banner
export const useDeleteBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("site_banners")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-banners"] });
      queryClient.invalidateQueries({ queryKey: ["active-banner"] });
      toast.success("ბანერი წარმატებით წაიშალა");
    },
    onError: (error) => {
      console.error("Error deleting banner:", error);
      toast.error("ბანერის წაშლისას მოხდა შეცდომა");
    },
  });
};
