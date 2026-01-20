import { useQuery } from "@tanstack/react-query";
import { FuelStation, FuelBrand, brandNameMap } from "@/types/fuelStation";

interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: {
    id?: string | number;
    name?: string;
    brand?: string;
    address?: {
      street?: string;
      housenumber?: string;
      city?: string;
      postcode?: string;
    };
    opening_hours?: string;
    phone?: string;
    website?: string;
    fuel_types?: {
      diesel?: boolean;
      octane_95?: boolean;
      octane_98?: boolean;
      lpg?: boolean;
      cng?: boolean;
    };
    services?: {
      shop?: boolean;
      car_wash?: boolean;
      toilets?: boolean;
      atm?: boolean;
    };
  };
}

interface GeoJSON {
  type: string;
  features: GeoJSONFeature[];
}

const normalizeBrand = (brand: string | undefined): FuelBrand => {
  if (!brand) return 'SOCAR';
  
  // Check direct mapping
  if (brandNameMap[brand]) {
    return brandNameMap[brand];
  }
  
  // Try uppercase
  const upperBrand = brand.toUpperCase();
  if (['SOCAR', 'WISSOL', 'ROMPETROL', 'GULF', 'PORTAL'].includes(upperBrand)) {
    return upperBrand as FuelBrand;
  }
  
  return 'SOCAR';
};

const fetchFuelStations = async (): Promise<FuelStation[]> => {
  const response = await fetch('/data/fuel-stations.geojson');
  if (!response.ok) {
    throw new Error('Failed to fetch fuel stations');
  }
  
  const geojson: GeoJSON = await response.json();
  
  return geojson.features
    .filter((f) => f.geometry?.type === 'Point' && f.geometry?.coordinates)
    .map((feature, index) => ({
      id: `station-${feature.properties.id || index}`,
      name: feature.properties.name || 'Unknown Station',
      brand: normalizeBrand(feature.properties.brand),
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      address: feature.properties.address,
      opening_hours: feature.properties.opening_hours,
      phone: feature.properties.phone,
      website: feature.properties.website,
      fuel_types: {
        diesel: feature.properties.fuel_types?.diesel || false,
        octane_95: feature.properties.fuel_types?.octane_95 || false,
        octane_98: feature.properties.fuel_types?.octane_98 || false,
        lpg: feature.properties.fuel_types?.lpg || false,
        cng: feature.properties.fuel_types?.cng || false,
      },
      services: {
        shop: feature.properties.services?.shop || false,
        car_wash: feature.properties.services?.car_wash || false,
        toilets: feature.properties.services?.toilets || false,
        atm: feature.properties.services?.atm || false,
      },
    }));
};

export const useFuelStations = () => {
  const query = useQuery({
    queryKey: ['fuel-stations'],
    queryFn: fetchFuelStations,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  return {
    stations: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
};
