export interface FuelStation {
  id: string;
  name: string;
  brand: FuelBrand;
  latitude: number;
  longitude: number;
  address?: {
    street?: string;
    housenumber?: string;
    city?: string;
    postcode?: string;
  };
  opening_hours?: string;
  phone?: string;
  website?: string;
  fuel_types: {
    diesel: boolean;
    octane_95: boolean;
    octane_98: boolean;
    lpg: boolean;
    cng: boolean;
  };
  services: {
    shop: boolean;
    car_wash: boolean;
    toilets: boolean;
    atm: boolean;
  };
}

export type FuelBrand = 'SOCAR' | 'WISSOL' | 'ROMPETROL' | 'GULF' | 'PORTAL';

// Brand colors for markers
export const brandColors: Record<FuelBrand, string> = {
  'SOCAR': '#00A651',
  'WISSOL': '#E31E24',
  'ROMPETROL': '#FFCC00',
  'GULF': '#FF6B00',
  'PORTAL': '#2E3192',
};

// Brand logos (existing files)
export const brandLogos: Record<FuelBrand, string> = {
  'SOCAR': '/fuel-company-logos/socar-logo.svg',
  'WISSOL': '/fuel-company-logos/wissol-logo.png',
  'ROMPETROL': '/fuel-company-logos/rompetrol-logo.png',
  'GULF': '/fuel-company-logos/gulf-logo.png',
  'PORTAL': '/fuel-company-logos/portal-logo.svg',
};

// Fuel type labels in Georgian
export const fuelTypeLabels: Record<string, string> = {
  'diesel': 'დიზელი',
  'octane_95': '95',
  'octane_98': '98',
  'lpg': 'LPG',
  'cng': 'CNG',
};

// Service labels in Georgian
export const serviceLabels: Record<string, string> = {
  'shop': 'მაღაზია',
  'car_wash': 'სამრეცხაო',
  'toilets': 'ტუალეტი',
  'atm': 'ATM',
};

// Map Georgian brand names to English
export const brandNameMap: Record<string, FuelBrand> = {
  'სოკარი': 'SOCAR',
  'ვისოლი': 'WISSOL',
  'რომპეტროლი': 'ROMPETROL',
  'გალფი': 'GULF',
  'პორტალი': 'PORTAL',
  'SOCAR': 'SOCAR',
  'WISSOL': 'WISSOL',
  'ROMPETROL': 'ROMPETROL',
  'GULF': 'GULF',
  'PORTAL': 'PORTAL',
};

export const getFuelStationColor = (brand: FuelBrand): string => {
  return brandColors[brand] || '#6B7280';
};

export const getFuelStationLogo = (brand: FuelBrand): string => {
  return brandLogos[brand] || '';
};
