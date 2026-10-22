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

export const publicServiceCityCountsOptions = {
  queryKey: ["public-service-city-counts"],
  staleTime: 60_000,
  gcTime: 5 * 60_000,
  retry: false,
  queryFn: async () => {
    const counts = new Map<string, number>();
    // Supabase caps responses: read every public active listing, not only the first page.
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from("mechanic_services")
        .select("city").not("city", "is", null).eq("is_active", true)
        .order("id").range(offset, offset + 999);
      if (error) throw error;
      for (const row of data || []) {
        const city = row.city?.trim();
        if (city) counts.set(city, (counts.get(city) || 0) + 1);
      }
      if (!data || data.length < 1000) break;
    }
    return [...counts].map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, "ka"));
  },
};

export const publicServiceCitiesOptions = {
  queryKey: ["public-service-cities"],
  staleTime: 60_000,
  gcTime: 5 * 60_000,
  retry: false,
  queryFn: async () => (await queryClient.fetchQuery(publicServiceCityCountsOptions)).map(row => row.city),
};

export function getPublicServiceCities() {
  return queryClient.fetchQuery(publicServiceCitiesOptions);
}
