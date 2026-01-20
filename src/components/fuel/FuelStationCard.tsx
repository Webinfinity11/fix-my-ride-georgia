import { FuelStation, getFuelStationColor, getFuelStationLogo, fuelTypeLabels, serviceLabels } from "@/types/fuelStation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Phone, Store, Droplets, CircleDot, Banknote } from "lucide-react";

interface FuelStationCardProps {
  station: FuelStation;
  isSelected?: boolean;
  onClick?: () => void;
}

export const FuelStationCard = ({ station, isSelected, onClick }: FuelStationCardProps) => {
  const brandColor = getFuelStationColor(station.brand);
  const logo = getFuelStationLogo(station.brand);
  
  const activeFuelTypes = Object.entries(station.fuel_types)
    .filter(([_, available]) => available)
    .map(([type]) => type);

  const activeServices = Object.entries(station.services)
    .filter(([_, available]) => available)
    .map(([service]) => service);

  const formatAddress = () => {
    if (!station.address) return null;
    const parts = [];
    if (station.address.street) parts.push(station.address.street);
    if (station.address.housenumber) parts.push(station.address.housenumber);
    if (station.address.city) parts.push(station.address.city);
    return parts.join(', ') || null;
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary shadow-md' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Brand Logo */}
          <div 
            className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center p-1.5"
            style={{ backgroundColor: `${brandColor}15` }}
          >
            {logo ? (
              <img 
                src={logo} 
                alt={station.brand} 
                className="w-full h-full object-contain"
              />
            ) : (
              <span 
                className="text-xs font-bold"
                style={{ color: brandColor }}
              >
                {station.brand}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-1">
              {station.name}
            </h3>
            
            {formatAddress() && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="line-clamp-1">{formatAddress()}</span>
              </div>
            )}

            {/* Fuel Types */}
            <div className="flex flex-wrap gap-1 mt-2">
              {activeFuelTypes.map((type) => (
                <Badge 
                  key={type}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                  style={{ 
                    backgroundColor: `${brandColor}20`,
                    color: brandColor,
                  }}
                >
                  {fuelTypeLabels[type] || type}
                </Badge>
              ))}
            </div>

            {/* Opening Hours & Services */}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              {station.opening_hours && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{station.opening_hours === '24/7' ? '24/7' : 'გახსნილია'}</span>
                </div>
              )}
              
              {activeServices.length > 0 && (
                <div className="flex items-center gap-1">
                  {activeServices.includes('shop') && <Store className="w-3 h-3" />}
                  {activeServices.includes('car_wash') && <Droplets className="w-3 h-3" />}
                  {activeServices.includes('atm') && <Banknote className="w-3 h-3" />}
                  {activeServices.includes('toilets') && <CircleDot className="w-3 h-3" />}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Mobile version for bottom sheet
export const MobileFuelStationCard = ({ station, isSelected, onClick }: FuelStationCardProps) => {
  const brandColor = getFuelStationColor(station.brand);
  const logo = getFuelStationLogo(station.brand);
  
  const activeFuelTypes = Object.entries(station.fuel_types)
    .filter(([_, available]) => available)
    .map(([type]) => type);

  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-primary/10' : 'bg-muted/50 hover:bg-muted'
      }`}
      onClick={onClick}
    >
      <div 
        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center p-1"
        style={{ backgroundColor: `${brandColor}15` }}
      >
        {logo ? (
          <img 
            src={logo} 
            alt={station.brand} 
            className="w-full h-full object-contain"
          />
        ) : (
          <span 
            className="text-[10px] font-bold"
            style={{ color: brandColor }}
          >
            {station.brand}
          </span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm line-clamp-1">{station.name}</h4>
        <div className="flex flex-wrap gap-1 mt-1">
          {activeFuelTypes.slice(0, 3).map((type) => (
            <Badge 
              key={type}
              variant="secondary"
              className="text-[9px] px-1 py-0"
            >
              {fuelTypeLabels[type] || type}
            </Badge>
          ))}
          {activeFuelTypes.length > 3 && (
            <Badge variant="secondary" className="text-[9px] px-1 py-0">
              +{activeFuelTypes.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
