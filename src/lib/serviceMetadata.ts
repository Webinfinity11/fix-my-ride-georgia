import { queryClient } from "@/lib/queryClient";
import { supabase } from "@/integrations/supabase/client";

export const publicCategoriesKey = ["public-service-categories"] as const;

// Full rows let filters and category/SEO pages share one consistent response.
// Only public metadata is cached; listings, prices and user profiles are not.
export function getPublicServiceCategories() {
  return queryClient.fetchQuery({
    queryKey: publicCategoriesKey,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.from("service_categories").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });
}

export function invalidatePublicServiceCategories() {
  return queryClient.invalidateQueries({ queryKey: publicCategoriesKey });
}

export const publicServiceCitiesOptions = {
  queryKey: ["public-service-cities"],
  staleTime: 60_000,
  gcTime: 5 * 60_000,
  retry: false,
  queryFn: async () => {
    const { data, error } = await supabase.from("mechanic_services")
      .select("city").not("city", "is", null).eq("is_active", true);
    if (error) throw error;
    return [...new Set((data || []).map(row => row.city).filter((city): city is string => !!city))].sort();
  },
};

export function getPublicServiceCities() {
  return queryClient.fetchQuery(publicServiceCitiesOptions);
}
