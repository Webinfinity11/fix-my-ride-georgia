import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  getWissolHistoricalPrices,
  getSocarAllHistorical,
  getSocarHistoricalPrices,
  getGulfHistoricalPrices,
  type CompanyName,
  type HistoricalPricesResponse,
  type AllHistoricalResponse,
} from "@/services/fuelPricesApi";

// Hook for fetching historical prices for a specific fuel type
export const useFuelHistory = (
  company: CompanyName,
  fuelType: string,
  days: number = 30,
  enabled: boolean = true,
  selfService = false
) => {
  return useQuery({
    queryKey: ["fuel-history", company, fuelType, days, selfService],
    queryFn: async (): Promise<HistoricalPricesResponse> => {
      const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
      const { data, error } = await supabase.from('fuel_price_daily_history')
        .select('observed_on, price, self_service_price, source_url')
        .ilike('company', company).eq('product', fuelType).gte('observed_on', since)
        .order('observed_on', { ascending: true });
      if (!error && data?.length) {
        const historicalPrices = data.flatMap(row => {
          const price = selfService ? row.self_service_price : row.price;
          return typeof price === 'number' && price > 0 ? [{ date: row.observed_on, price }] : [];
        });
        return { success: true, timestamp: new Date().toISOString(), source: 'FixUp daily observations',
          data: { fuelType, historicalPrices, totalRecords: historicalPrices.length },
        };
      }
      // Existing history remains available during migration. The old API does
      // not support self-service tariffs or the newly added company archives.
      if (selfService || !['wissol', 'socar', 'gulf'].includes(company)) {
        return { success: true, timestamp: new Date().toISOString(), data: { fuelType, historicalPrices: [], totalRecords: 0 } };
      }
      switch (company) {
        case "wissol":
          return await getWissolHistoricalPrices(fuelType, days);
        case "socar":
          return await getSocarHistoricalPrices(fuelType);
        case "gulf":
          return await getGulfHistoricalPrices(fuelType, days);
        default:
          throw new Error(`Historical data not available for ${company}`);
      }
    },
    enabled: enabled && Boolean(fuelType),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Hook for fetching all historical data for Socar
export const useSocarAllHistorical = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["socar-all-historical"],
    queryFn: async () => {
      return await getSocarAllHistorical();
    },
    enabled,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

// Helper to check if company supports historical data
export const supportsHistoricalData = (company: string): boolean => {
  return ["wissol", "socar", "gulf", "portal", "rompetrol", "connect", "lukoil", "neogas"].includes(company.toLowerCase());
};

// Get available date ranges based on company
export const getDateRangeOptions = (company: CompanyName) => {
  switch (company) {
    case "wissol":
      return [
        { label: "7 დღე", value: 7 },
        { label: "14 დღე", value: 14 },
        { label: "30 დღე", value: 30 },
        { label: "90 დღე", value: 90 },
      ];
    case "gulf":
      return [
        { label: "7 დღე", value: 7 },
        { label: "14 დღე", value: 14 },
      ];
    case "socar":
      // Socar returns all available historical data
      return [{ label: "ყველა", value: 30 }];
    default:
      return [{ label: "7 დღე", value: 7 }, { label: "30 დღე", value: 30 }, { label: "90 დღე", value: 90 }];
  }
};
