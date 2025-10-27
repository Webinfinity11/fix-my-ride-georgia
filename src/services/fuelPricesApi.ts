// Fuel Prices API Service
// Based on API_INTEGRATION_GUIDE.md (v1.0.0)

// Use relative URL in development (proxied by Vite), absolute in production
const API_BASE_URL = import.meta.env.DEV
  ? "" // Relative path - will be proxied by Vite
  : "https://fuel-prices-backend.onrender.com";

// ============================================================================
// Type Definitions
// ============================================================================

// Supported company names
export type CompanyName = "wissol" | "portal" | "connect" | "socar" | "gulf" | "rompetrol";

// Basic fuel price structure
export interface FuelPrice {
  fuelType: string;
  fuelTypeEnglish?: string;
  price: number;
  currency: string;
  abbreviation?: string; // Gulf & Rompetrol
  specifications?: string; // Portal
}

// Company data structure
export interface Company {
  name: string;
  fuelPrices: FuelPrice[];
  totalFuelTypes?: number;
  priceRange?: {
    min: number;
    max: number;
  };
}

// Fuel type information
export interface FuelTypeInfo {
  name: string;
  englishName?: string;
  georgianName?: string;
  abbreviation?: string;
}

// Price range structure
export interface PriceRange {
  min: number;
  max: number;
}

// ============================================================================
// API Response Interfaces
// ============================================================================

// Base response structure
interface BaseResponse {
  success: boolean;
  timestamp: string;
  source?: string;
  scrapeDuration?: number;
}

// Legacy response (for backward compatibility)
export interface FuelPricesResponse extends BaseResponse {
  cached: boolean;
  cacheAge: number;
  data: {
    companies: Company[];
    totalCompanies: number;
    totalFuelTypes: number;
  };
}

// Individual company response
export interface CompanyPricesResponse extends BaseResponse {
  data: {
    company: string;
    fuelPrices: FuelPrice[];
    totalFuelTypes: number;
    priceRange: PriceRange;
  };
}

// Fuel types response
export interface FuelTypesResponse extends BaseResponse {
  data: {
    fuelTypes: FuelTypeInfo[];
    totalTypes: number;
  };
}

// Historical price record
export interface HistoricalPriceRecord {
  date: string;
  price: number;
}

// Price change information
export interface PriceChange {
  amount: number;
  percentage: number;
}

// Historical prices response (Wissol, specific fuel)
export interface HistoricalPricesResponse extends BaseResponse {
  data: {
    fuelType: string;
    historicalPrices: HistoricalPriceRecord[];
    totalRecords: number;
    priceChange?: PriceChange;
  };
}

// Historical data for all fuels (Socar)
export interface AllHistoricalResponse extends BaseResponse {
  data: {
    company: string;
    historicalData: Array<{
      fuelType: string;
      fuelTypeEnglish?: string;
      priceHistory: HistoricalPriceRecord[];
      totalRecords: number;
    }>;
  };
}

// Summary response
export interface SummaryResponse extends BaseResponse {
  data: {
    company: string;
    summary: {
      totalFuelTypes: number;
      averagePrice: number;
      minPrice: number;
      maxPrice: number;
      priceSpread: number;
    };
    fuelPrices: FuelPrice[];
  };
}

// Comparison response
export interface ComparisonResponse extends BaseResponse {
  data: {
    company: string;
    cheapestFuel: {
      fuelType: string;
      price: number;
    };
    mostExpensiveFuel: {
      fuelType: string;
      price: number;
    };
    comparisons: Array<{
      fuelType: string;
      price: number;
      differenceFromAverage: number;
    }>;
  };
}

// Trend information (Socar)
export interface TrendInfo {
  fuelType: string;
  currentPrice: number;
  trend: "stable" | "increasing" | "decreasing";
  change7Days: number;
  change30Days: number;
  percentChange: number;
}

export interface TrendResponse extends BaseResponse {
  data: {
    company: string;
    trends: TrendInfo[];
  };
}

// Health check response
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
  companies: string[];
}

// Error response
export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  timestamp: string;
  retryAfter?: number; // For rate limit errors
}

// ============================================================================
// Legacy Interfaces (for backward compatibility)
// ============================================================================

export interface BestPricesResponse extends BaseResponse {
  cached: boolean;
  cacheAge: number;
  data: {
    bestPrices: Array<FuelPrice & { company: string }>;
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

// Custom error class for rate limiting
export class RateLimitError extends Error {
  retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

// Sleep utility for retry logic
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced fetch with retry logic and error handling
async function fetchWithRetry<T>(
  url: string,
  maxRetries = 3,
  baseDelay = 2000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);

      // Handle rate limiting (429)
      if (response.status === 429) {
        const errorData: ErrorResponse = await response.json();
        const retryAfter = errorData.retryAfter || Math.pow(2, attempt + 1);

        if (attempt < maxRetries - 1) {
          console.warn(`Rate limited. Retrying after ${retryAfter}s...`);
          await sleep(retryAfter * 1000);
          continue;
        }

        throw new RateLimitError(
          errorData.message || "Rate limit exceeded",
          retryAfter
        );
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorData: ErrorResponse = await response.json().catch(() => ({
          success: false,
          error: `HTTP ${response.status}`,
          timestamp: new Date().toISOString(),
        }));

        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Check API-level success
      if (!data.success) {
        throw new Error(data.error || "API returned unsuccessful response");
      }

      return data as T;
    } catch (error) {
      lastError = error as Error;

      // Don't retry rate limit errors or network errors on last attempt
      if (
        error instanceof RateLimitError ||
        attempt === maxRetries - 1
      ) {
        break;
      }

      // Network error - retry with exponential backoff
      if (error instanceof TypeError) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Network error. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }

      // Other errors - don't retry
      break;
    }
  }

  // If we get here, all retries failed
  if (lastError instanceof TypeError) {
    throw new Error("Network error - check API server connection");
  }

  throw lastError || new Error("Unknown error occurred");
}

// URL encode Georgian characters and special chars
function encodeParam(param: string): string {
  return encodeURIComponent(param);
}

// ============================================================================
// API Functions
// ============================================================================

// Fetch all fuel prices from all companies (Legacy endpoint)
export const getAllFuelPrices = async (forceRefresh = false): Promise<FuelPricesResponse> => {
  const url = `${API_BASE_URL}/api/fuel-prices${forceRefresh ? "?refresh=true" : ""}`;
  return fetchWithRetry<FuelPricesResponse>(url);
};

// Fetch best prices across all companies (Legacy endpoint)
export const getBestPrices = async (forceRefresh = false): Promise<BestPricesResponse> => {
  const url = `${API_BASE_URL}/api/fuel-prices/best${forceRefresh ? "?refresh=true" : ""}`;
  return fetchWithRetry<BestPricesResponse>(url);
};

// ============================================================================
// Individual Company Endpoints
// ============================================================================

export interface CompanyPricesOptions {
  english?: boolean;
  specifications?: boolean; // For Portal
}

// Get current prices for a specific company
export const getCompanyPrices = async (
  company: CompanyName,
  options: CompanyPricesOptions = {}
): Promise<CompanyPricesResponse> => {
  const params = new URLSearchParams();
  if (options.english) params.append("english", "true");
  if (options.specifications) params.append("specifications", "true");

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/fuel-prices/${company}${queryString ? `?${queryString}` : ""}`;

  return fetchWithRetry<CompanyPricesResponse>(url);
};

// Get available fuel types for a company
export const getCompanyFuelTypes = async (
  company: CompanyName
): Promise<FuelTypesResponse> => {
  const url = `${API_BASE_URL}/api/fuel-prices/${company}/fuel-types`;
  return fetchWithRetry<FuelTypesResponse>(url);
};

// Get specific fuel details by type
export const getSpecificFuel = async (
  company: CompanyName,
  fuelType: string
): Promise<CompanyPricesResponse> => {
  const encodedFuelType = encodeParam(fuelType);
  const url = `${API_BASE_URL}/api/fuel-prices/${company}/fuel/${encodedFuelType}`;
  return fetchWithRetry<CompanyPricesResponse>(url);
};

// Get company summary statistics
export const getCompanySummary = async (
  company: CompanyName
): Promise<SummaryResponse> => {
  const url = `${API_BASE_URL}/api/fuel-prices/${company}/summary`;
  return fetchWithRetry<SummaryResponse>(url);
};

// Get price comparison within company
export const getCompanyComparison = async (
  company: CompanyName
): Promise<ComparisonResponse> => {
  const url = `${API_BASE_URL}/api/fuel-prices/${company}/compare`;
  return fetchWithRetry<ComparisonResponse>(url);
};

// ============================================================================
// Historical Data Endpoints (Wissol, Socar, Gulf)
// ============================================================================

// Get historical prices for Wissol (specific fuel type)
export const getWissolHistoricalPrices = async (
  fuelType: string,
  days = 30
): Promise<HistoricalPricesResponse> => {
  const encodedFuelType = encodeParam(fuelType);
  const url = `${API_BASE_URL}/api/fuel-prices/wissol/historical/${encodedFuelType}?days=${days}`;
  return fetchWithRetry<HistoricalPricesResponse>(url);
};

// Get all historical prices for Socar
export const getSocarAllHistorical = async (): Promise<AllHistoricalResponse> => {
  const url = `${API_BASE_URL}/api/fuel-prices/socar/historical`;
  return fetchWithRetry<AllHistoricalResponse>(url);
};

// Get historical prices for specific Socar fuel
export const getSocarHistoricalPrices = async (
  fuelType: string
): Promise<HistoricalPricesResponse> => {
  const encodedFuelType = encodeParam(fuelType);
  const url = `${API_BASE_URL}/api/fuel-prices/socar/historical/${encodedFuelType}`;
  return fetchWithRetry<HistoricalPricesResponse>(url);
};

// Get price trends for Socar
export const getSocarPriceTrends = async (): Promise<TrendResponse> => {
  const url = `${API_BASE_URL}/api/fuel-prices/socar/trend`;
  return fetchWithRetry<TrendResponse>(url);
};

// Get historical prices for Gulf (specific fuel type)
export const getGulfHistoricalPrices = async (
  fuelType: string,
  days = 14
): Promise<HistoricalPricesResponse> => {
  const encodedFuelType = encodeParam(fuelType);
  const url = `${API_BASE_URL}/api/fuel-prices/gulf/history/${encodedFuelType}?days=${days}`;
  return fetchWithRetry<HistoricalPricesResponse>(url);
};

// ============================================================================
// Premium/Standard Fuel Filtering (Gulf & Rompetrol)
// ============================================================================

// Get Gulf G-Force premium fuels
export const getGulfGForceFuels = async (): Promise<CompanyPricesResponse> => {
  const url = `${API_BASE_URL}/api/fuel-prices/gulf/g-force`;
  return fetchWithRetry<CompanyPricesResponse>(url);
};

// Get Gulf standard fuels
export const getGulfStandardFuels = async (): Promise<CompanyPricesResponse> => {
  const url = `${API_BASE_URL}/api/fuel-prices/gulf/standard`;
  return fetchWithRetry<CompanyPricesResponse>(url);
};

// Get Rompetrol Efix premium fuels
export const getRompetrolEfixFuels = async (): Promise<CompanyPricesResponse> => {
  const url = `${API_BASE_URL}/api/fuel-prices/rompetrol/efix`;
  return fetchWithRetry<CompanyPricesResponse>(url);
};

// Get Rompetrol standard fuels
export const getRompetrolStandardFuels = async (): Promise<CompanyPricesResponse> => {
  const url = `${API_BASE_URL}/api/fuel-prices/rompetrol/standard`;
  return fetchWithRetry<CompanyPricesResponse>(url);
};

// Get Portal fuel specifications
export const getPortalSpecifications = async (): Promise<CompanyPricesResponse> => {
  const url = `${API_BASE_URL}/api/fuel-prices/portal/specifications`;
  return fetchWithRetry<CompanyPricesResponse>(url);
};

// ============================================================================
// Health Check & Utilities
// ============================================================================

// Check API health
export const checkApiHealth = async (): Promise<HealthCheckResponse> => {
  const url = `${API_BASE_URL}/api/health`;
  return fetchWithRetry<HealthCheckResponse>(url, 1); // Only 1 attempt for health check
};

// Get all supported companies
export const getSupportedCompanies = (): CompanyName[] => {
  return ["wissol", "portal", "connect", "socar", "gulf", "rompetrol"];
};

// Check if historical data is available for a company
export const hasHistoricalData = (company: CompanyName): boolean => {
  return ["wissol", "socar", "gulf"].includes(company);
};
