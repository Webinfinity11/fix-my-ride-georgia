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
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["fuel-history", company, fuelType, days],
    queryFn: async () => {
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
  return ["wissol", "socar", "gulf"].includes(company.toLowerCase());
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
      return [];
  }
};
