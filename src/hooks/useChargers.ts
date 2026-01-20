import { useQuery } from "@tanstack/react-query";
import { ChargerLocation } from "@/types/charger";

interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    name_ka?: string;
    name_en?: string;
    type?: string;
    source?: string;
    status?: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

interface GeoJSONData {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

const transformFeature = (feature: GeoJSONFeature, index: number): ChargerLocation => {
  const { properties, geometry } = feature;
  
  return {
    id: `charger-${index}`,
    name_ka: properties.name_ka || 'უცნობი დამტენი',
    name_en: properties.name_en || 'Unknown Charger',
    type: properties.type || 'charger',
    source: properties.source || 'unknown',
    status: properties.status,
    longitude: geometry.coordinates[0],
    latitude: geometry.coordinates[1],
  };
};

const fetchChargers = async (): Promise<ChargerLocation[]> => {
  const response = await fetch('/data/chargers.geojson');
  if (!response.ok) {
    throw new Error('Failed to fetch chargers data');
  }
  const geojson: GeoJSONData = await response.json();
  
  return geojson.features
    .filter(feature => feature.geometry?.type === 'Point' && feature.geometry?.coordinates)
    .map(transformFeature);
};

export const useChargers = () => {
  const query = useQuery({
    queryKey: ['chargers'],
    queryFn: fetchChargers,
    staleTime: 1000 * 60 * 60, // 1 hour - static data
    gcTime: 1000 * 60 * 60 * 24, // 24 hours cache
  });

  return {
    chargers: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
};
