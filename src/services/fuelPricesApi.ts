// Fuel Prices API Service
// Based on API_INTEGRATION_GUIDE.md

const API_BASE_URL = "https://fuel-prices-backend.onrender.com/";

export interface FuelPrice {
  fuelType: string;
  price: number;
  currency: string;
}

export interface Company {
  name: string;
  fuelPrices: FuelPrice[];
}

export interface FuelPricesResponse {
  success: boolean;
  timestamp: string;
  source: string;
  scrapeDuration: number;
  cached: boolean;
  cacheAge: number;
  data: {
    companies: Company[];
    totalCompanies: number;
    totalFuelTypes: number;
  };
}

export interface BestPricesResponse {
  success: boolean;
  timestamp: string;
  source: string;
  cached: boolean;
  cacheAge: number;
  data: {
    bestPrices: Array<FuelPrice & { company: string }>;
  };
}

// Fetch all fuel prices from all companies
export const getAllFuelPrices = async (forceRefresh = false): Promise<FuelPricesResponse> => {
  const url = `${API_BASE_URL}/api/fuel-prices${forceRefresh ? "?refresh=true" : ""}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch fuel prices");
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Network error - check API server connection");
    }
    throw error;
  }
};

// Fetch best prices across all companies
export const getBestPrices = async (forceRefresh = false): Promise<BestPricesResponse> => {
  const url = `${API_BASE_URL}/api/fuel-prices/best${forceRefresh ? "?refresh=true" : ""}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch best prices");
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Network error - check API server connection");
    }
    throw error;
  }
};

// Fetch prices for a specific company
export const getCompanyPrices = async (
  companyName: string,
  forceRefresh = false,
): Promise<{ success: boolean; data: Company }> => {
  const url = `${API_BASE_URL}/api/fuel-prices/company/${companyName}${forceRefresh ? "?refresh=true" : ""}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch company prices");
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Network error - check API server connection");
    }
    throw error;
  }
};

// Check API health
export const checkApiHealth = async (): Promise<{
  status: string;
  timestamp: string;
  uptime: number;
  cache: any;
}> => {
  const url = `${API_BASE_URL}/api/health`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("API is not reachable");
    }
    throw error;
  }
};
