import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import {
  getAllFuelPrices,
  getCompanyPrices,
  getSupportedCompanies,
  RateLimitError,
  type Company,
  type FuelPrice,
  type CompanyName,
  type CompanyPricesOptions,
} from "@/services/fuelPricesApi";

type FuelImporterBase = Database["public"]["Tables"]["fuel_importers"]["Row"];
type FuelImporterInsert = Database["public"]["Tables"]["fuel_importers"]["Insert"];
type FuelImporterUpdate = Database["public"]["Tables"]["fuel_importers"]["Update"];

// Extended type with all fuel prices from API
export type FuelImporter = FuelImporterBase & {
  fuelPrices?: FuelPrice[];
  totalFuelTypes?: number;
  lastUpdated?: string;
  priceRange?: {
    min: number;
    max: number;
  };
};

// Helper function to map fuel type names to price categories
const mapFuelTypeToPrice = (fuelType: string): 'super' | 'premium' | 'regular' | null => {
  const normalizedType = fuelType.toLowerCase();

  // Super/100 octane
  if (normalizedType.includes('სუპერ') || normalizedType.includes('100') ||
      normalizedType.includes('super') || normalizedType.includes('ექტო 100')) {
    return 'super';
  }

  // Premium/95-96 octane
  if (normalizedType.includes('პრემიუმ') || normalizedType.includes('95') ||
      normalizedType.includes('96') || normalizedType.includes('premium')) {
    return 'premium';
  }

  // Regular/92-93 octane
  if (normalizedType.includes('რეგულარ') || normalizedType.includes('92') ||
      normalizedType.includes('93') || normalizedType.includes('regular')) {
    return 'regular';
  }

  return null;
};

// Transform API company data to FuelImporter format
const transformCompanyToImporter = (company: Company, index: number, timestamp: string): FuelImporter => {
  const prices = {
    super_ron_98_price: null as number | null,
    premium_ron_96_price: null as number | null,
    regular_ron_93_price: null as number | null,
  };

  // Map each fuel price to the appropriate category (for backward compatibility)
  company.fuelPrices.forEach((fuelPrice: FuelPrice) => {
    const priceType = mapFuelTypeToPrice(fuelPrice.fuelType);

    if (priceType === 'super' && prices.super_ron_98_price === null) {
      prices.super_ron_98_price = fuelPrice.price;
    } else if (priceType === 'premium' && prices.premium_ron_96_price === null) {
      prices.premium_ron_96_price = fuelPrice.price;
    } else if (priceType === 'regular' && prices.regular_ron_93_price === null) {
      prices.regular_ron_93_price = fuelPrice.price;
    }
  });

  return {
    id: index + 1, // Generate ID from index
    name: company.name,
    logo_url: null, // API doesn't provide logo URLs
    ...prices,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    // Additional fields for displaying all fuel types
    fuelPrices: company.fuelPrices,
    totalFuelTypes: company.totalFuelTypes || company.fuelPrices.length,
    lastUpdated: timestamp,
    priceRange: company.priceRange,
  };
};

// Options for useFuelImporters hook
export interface UseFuelImportersOptions {
  english?: boolean;
  enableFallback?: boolean; // Enable Supabase fallback (default: true)
}

// ── Persistent cache ────────────────────────────────────────────────────────
// The upstream backend (fuel-prices-backend.onrender.com) runs in "scrape-only"
// mode: no server-side cache, so every request live-scrapes the source sites
// (2–11s per company). To avoid re-scraping on every page load / hard refresh,
// we persist the transformed result to localStorage and treat it as fresh for
// 6 hours. Fuel prices don't change more than a couple of times a day, so a 6h
// window is plenty. The manual "განახლება" button and pull-to-refresh call
// refetch(), which bypasses staleTime and always fetches live data.
const FUEL_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
const fuelCacheKey = (english: boolean) => `fuel-importers-cache-v1:${english ? "en" : "ka"}`;

type FuelCacheEntry = { data: FuelImporter[]; ts: number };

const readFuelCache = (english: boolean): FuelCacheEntry | null => {
  try {
    const raw = localStorage.getItem(fuelCacheKey(english));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FuelCacheEntry;
    if (parsed && Array.isArray(parsed.data) && typeof parsed.ts === "number") return parsed;
  } catch {
    /* ignore malformed / unavailable storage */
  }
  return null;
};

const writeFuelCache = (english: boolean, data: FuelImporter[]) => {
  try {
    localStorage.setItem(fuelCacheKey(english), JSON.stringify({ data, ts: Date.now() }));
  } catch {
    /* storage full / unavailable — non-fatal */
  }
};

export const useFuelImporters = (options: UseFuelImportersOptions = {}) => {
  const { english = true, enableFallback = true } = options;

  return useQuery({
    queryKey: ["fuel-importers", { english }],
    queryFn: async () => {
      // 1) Platform-wide cache via the `fuel-prices` edge function. It serves a
      //    single Supabase-cached row (refreshed every 6h by cron), so every
      //    visitor gets prices in ~200ms and only the cron ever triggers a live
      //    scrape. This is the normal path; on any failure we fall through to
      //    scraping the upstream API directly (below).
      try {
        const { data: fn, error: fnErr } = await supabase.functions.invoke("fuel-prices");
        const cachedCompanies = fn?.data?.companies as (Company & { timestamp?: string })[] | undefined;
        if (!fnErr && cachedCompanies?.length) {
          const importers = cachedCompanies.map((c, i) =>
            transformCompanyToImporter(c, i, c.timestamp || fn.data.fetchedAt)
          );
          if (importers.length > 0) {
            writeFuelCache(english, importers);
            return importers;
          }
        }
      } catch (e) {
        console.warn("fuel-prices edge function unavailable — falling back to direct API", e);
      }

      try {
        // Fetch data from all companies using individual endpoints for better data
        const companies = getSupportedCompanies();
        const promises = companies.map((companyName) =>
          getCompanyPrices(companyName, { english })
        );

        const responses = await Promise.allSettled(promises);

        // Process successful responses
        const importers: FuelImporter[] = [];

        responses.forEach((result, index) => {
          if (result.status === "fulfilled") {
            const response = result.value;

            try {
              const company: Company = {
                name: response.data.company,
                fuelPrices: response.data.fuelPrices,
                totalFuelTypes: response.data.totalFuelTypes,
                priceRange: response.data.priceRange,
              };

              const importer = transformCompanyToImporter(company, index, response.timestamp);
              importers.push(importer);
            } catch (transformError) {
              console.error(`Failed to transform ${companies[index]}:`, transformError);
            }
          } else {
            console.warn(`Failed to fetch ${companies[index]}:`, result.reason?.message || result.reason);
          }
        });

        // If no companies were fetched successfully, throw error to trigger fallback
        if (importers.length === 0) {
          throw new Error("No fuel prices available from API");
        }

        writeFuelCache(english, importers);
        return importers;
      } catch (error) {
        console.error("Error fetching fuel prices from API:", error);

        // Handle rate limit errors specially
        if (error instanceof RateLimitError) {
          toast.error(`Rate limit exceeded. გთხოვთ სცადოთ ${error.retryAfter} წამში`);
          throw error; // Re-throw to prevent fallback
        }

        // Fallback to Supabase if API fails (and fallback is enabled)
        if (enableFallback) {
          console.log("Falling back to Supabase...");

          const { data, error: supabaseError } = await supabase
            .from("fuel_importers")
            .select("*")
            .order("name", { ascending: true });

          if (supabaseError) throw supabaseError;
          const fallback = (data ?? []) as FuelImporter[];
          if (fallback.length > 0) writeFuelCache(english, fallback);
          return fallback;
        }

        throw error;
      }
    },
    // Hydrate instantly from the last persisted result so repeat visits / hard
    // reloads don't re-scrape. If it's <6h old it counts as fresh (no fetch);
    // older than that, React Query shows it immediately and refetches in the
    // background.
    initialData: () => readFuelCache(english)?.data,
    initialDataUpdatedAt: () => readFuelCache(english)?.ts,
    staleTime: FUEL_CACHE_TTL, // 6 hours — prices change at most a couple of times a day
    gcTime: FUEL_CACHE_TTL,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors
      if (error instanceof RateLimitError) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
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

// Hooks for fuel page banner
export const useFuelPageSettings = () => {
  return useQuery({
    queryKey: ["fuel-page-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fuel_page_settings")
        .select("*")
        .eq("id", "1")
        .single();

      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateFuelPageBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bannerUrl: string | null) => {
      const { error } = await supabase
        .from("fuel_page_settings")
        .update({ banner_url: bannerUrl, updated_at: new Date().toISOString() })
        .eq("id", "1");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-page-settings"] });
      toast.success("ბანერი წარმატებით განახლდა");
    },
    onError: (error) => {
      console.error("Error updating banner:", error);
      toast.error("შეცდომა ბანერის განახლებისას");
    },
  });
};
