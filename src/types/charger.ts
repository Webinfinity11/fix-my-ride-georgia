export interface ChargerLocation {
  id: string;
  name_ka: string;
  name_en: string;
  type: ChargerLocationType;
  source: 'emotors' | 'espace' | string;
  status?: 'level2' | 'fast' | string;
  latitude: number;
  longitude: number;
}

export type ChargerLocationType = 
  | 'hotel' 
  | 'shopping' 
  | 'gas_station' 
  | 'business' 
  | 'clinic' 
  | 'hospital'
  | 'recreation'
  | 'university'
  | 'charger'
  | 'fast_charger'
  | string;

// Georgian translations for charger types
export const chargerTypeLabels: Record<string, string> = {
  'hotel': 'სასტუმრო',
  'shopping': 'სავაჭრო ცენტრი',
  'gas_station': 'ბენზინგასამართი',
  'business': 'ბიზნეს ცენტრი',
  'clinic': 'კლინიკა',
  'hospital': 'საავადმყოფო',
  'recreation': 'დასასვენებელი',
  'university': 'უნივერსიტეტი',
  'charger': 'დამტენი',
  'fast_charger': 'სწრაფი დამტენი',
};

// Colors for different charger types
export const chargerTypeColors: Record<string, string> = {
  'fast_charger': '#16A34A', // Green for fast chargers
  'charger': '#EAB308', // Yellow for regular chargers
  'gas_station': '#EA580C', // Orange
  'hotel': '#8B5CF6', // Purple
  'shopping': '#EC4899', // Pink
  'business': '#3B82F6', // Blue
  'clinic': '#EF4444', // Red
  'hospital': '#EF4444', // Red
  'recreation': '#14B8A6', // Teal
  'university': '#6366F1', // Indigo
};

// Get color for charger type
export const getChargerColor = (type: string): string => {
  return chargerTypeColors[type] || '#EAB308'; // Default yellow
};

// Get label for charger type
export const getChargerTypeLabel = (type: string): string => {
  return chargerTypeLabels[type] || type;
};
