import { ChargerLocation, getChargerTypeLabel, getChargerColor } from "@/types/charger";
import { FuelStation, getFuelStationColor, getFuelStationLogo, fuelTypeLabels } from "@/types/fuelStation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Navigation, BatteryCharging, Zap, MapPin, Phone, Fuel } from "lucide-react";

interface MapPreviewCardProps {
  charger?: ChargerLocation | null;
  station?: FuelStation | null;
  onClose: () => void;
  onNavigate?: (item: ChargerLocation | FuelStation) => void;
}

export const MapPreviewCard = ({ charger, station, onClose, onNavigate }: MapPreviewCardProps) => {
  // Display charger or station
  const item = charger || station;
  if (!item) return null;

  const isCharger = !!charger;
  const isStation = !!station;

  const handleNavigate = () => {
    const lat = 'latitude' in item ? item.latitude : 0;
    const lng = 'longitude' in item ? item.longitude : 0;
    if (onNavigate) {
      onNavigate(item);
    } else {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        '_blank'
      );
    }
  };

  const handleCall = () => {
    if (isStation && station?.phone) {
      window.open(`tel:${station.phone}`, '_self');
    }
  };

  // Charger preview
  if (isCharger && charger) {
    const isFastCharger = charger.type === 'fast_charger' || charger.status === 'fast';
    const typeColor = getChargerColor(charger.type);

    return (
      <div className="absolute bottom-20 left-3 right-3 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <Card className="shadow-xl border-2">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <div 
                className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: typeColor }}
              >
                {isFastCharger ? (
                  <BatteryCharging className="w-6 h-6 text-white" />
                ) : (
                  <Zap className="w-6 h-6 text-white" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm line-clamp-2">
                    {charger.name_ka}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 -mt-1 -mr-1"
                    onClick={onClose}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ 
                      backgroundColor: `${typeColor}20`,
                      color: typeColor,
                    }}
                  >
                    {getChargerTypeLabel(charger.type)}
                  </Badge>
                  
                  {isFastCharger && (
                    <Badge className="text-xs bg-green-100 text-green-700">
                      ⚡ სწრაფი დამტენი
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span className="capitalize">{charger.source}</span>
                </div>
              </div>
            </div>

            <Button 
              className="w-full mt-3 gap-2" 
              size="sm"
              onClick={handleNavigate}
            >
              <Navigation className="w-4 h-4" />
              მარშრუტი
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Station preview
  if (isStation && station) {
    const brandColor = getFuelStationColor(station.brand);
    const logo = getFuelStationLogo(station.brand);
    
    const activeFuelTypes = Object.entries(station.fuel_types)
      .filter(([_, available]) => available)
      .map(([type]) => type);

    return (
      <div className="absolute bottom-20 left-3 right-3 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <Card className="shadow-xl border-2">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <div 
                className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center p-1.5"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                {logo ? (
                  <img src={logo} alt={station.brand} className="w-full h-full object-contain" />
                ) : (
                  <Fuel className="w-6 h-6" style={{ color: brandColor }} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm line-clamp-2">
                    {station.name}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 -mt-1 -mr-1"
                    onClick={onClose}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-1.5">
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

                {station.opening_hours && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <span>{station.opening_hours === '24/7' ? '🕐 24/7' : `🕐 ${station.opening_hours}`}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button 
                className="flex-1 gap-2" 
                size="sm"
                onClick={handleNavigate}
              >
                <Navigation className="w-4 h-4" />
                მარშრუტი
              </Button>
              
              {station.phone && (
                <Button 
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleCall}
                >
                  <Phone className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};
