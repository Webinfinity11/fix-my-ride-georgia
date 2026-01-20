import { ChargerLocation, getChargerTypeLabel, getChargerColor } from "@/types/charger";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Navigation, BatteryCharging, Zap, MapPin } from "lucide-react";

interface MapPreviewCardProps {
  charger: ChargerLocation | null;
  onClose: () => void;
  onNavigate?: (charger: ChargerLocation) => void;
}

export const MapPreviewCard = ({ charger, onClose, onNavigate }: MapPreviewCardProps) => {
  if (!charger) return null;

  const isFastCharger = charger.type === 'fast_charger' || charger.status === 'fast';
  const typeColor = getChargerColor(charger.type);

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate(charger);
    } else {
      // Open Google Maps with directions
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${charger.latitude},${charger.longitude}`,
        '_blank'
      );
    }
  };

  return (
    <div className="absolute bottom-20 left-3 right-3 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <Card className="shadow-xl border-2">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Icon */}
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

            {/* Content */}
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

          {/* Navigate Button */}
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
};
