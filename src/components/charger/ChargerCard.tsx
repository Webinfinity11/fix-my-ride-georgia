import { ChargerLocation, getChargerTypeLabel, getChargerColor } from "@/types/charger";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Zap, BatteryCharging } from "lucide-react";

interface ChargerCardProps {
  charger: ChargerLocation;
  onClick?: () => void;
  isSelected?: boolean;
}

export const ChargerCard = ({ charger, onClick, isSelected }: ChargerCardProps) => {
  const isFastCharger = charger.type === 'fast_charger' || charger.status === 'fast';
  const typeColor = getChargerColor(charger.type);

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-yellow-500 shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div 
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: typeColor }}
          >
            {isFastCharger ? (
              <BatteryCharging className="w-5 h-5 text-white" />
            ) : (
              <Zap className="w-5 h-5 text-white" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 mb-1">
              {charger.name_ka}
            </h3>
            
            <div className="flex flex-wrap gap-1 mb-1">
              <Badge 
                variant="secondary" 
                className="text-xs"
                style={{ 
                  backgroundColor: `${typeColor}20`,
                  color: typeColor,
                  borderColor: typeColor
                }}
              >
                {getChargerTypeLabel(charger.type)}
              </Badge>
              
              {isFastCharger && (
                <Badge className="text-xs bg-green-100 text-green-700 border-green-300">
                  ⚡ სწრაფი
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="capitalize">{charger.source}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
