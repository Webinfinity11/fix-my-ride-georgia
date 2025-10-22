import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { getAllFuelPrices, type Company, type FuelPrice } from "@/services/fuelPricesApi";

type FuelImporterBase = Database["public"]["Tables"]["fuel_importers"]["Row"];
type FuelImporterInsert = Database["public"]["Tables"]["fuel_importers"]["Insert"];
type FuelImporterUpdate = Database["public"]["Tables"]["fuel_importers"]["Update"];

// Extended type with all fuel prices from API
export type FuelImporter = FuelImporterBase & {
  fuelPrices?: FuelPrice[];
  totalFuelTypes?: number;
  lastUpdated?: string;
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
    totalFuelTypes: company.fuelPrices.length,
    lastUpdated: timestamp,
  };
};

export const useFuelImporters = () => {
  return useQuery({
    queryKey: ["fuel-importers"],
    queryFn: async () => {
      try {
        // Fetch data from the Fuel Prices API
        const response = await getAllFuelPrices();

        // Transform API response to FuelImporter format
        const importers = response.data.companies.map((company, index) =>
          transformCompanyToImporter(company, index, response.timestamp)
        );

        return importers;
      } catch (error) {
        console.error("Error fetching fuel prices from API:", error);

        // Fallback to Supabase if API fails
        const { data, error: supabaseError } = await supabase
          .from("fuel_importers")
          .select("*")
          .order("name", { ascending: true });

        if (supabaseError) throw supabaseError;
        return data as FuelImporter[];
      }
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
