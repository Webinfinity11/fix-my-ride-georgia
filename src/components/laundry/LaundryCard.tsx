import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Car, Image } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Laundry = Database["public"]["Tables"]["laundries"]["Row"];

interface LaundryCardProps {
  laundry: Laundry;
  onViewDetails?: (laundry: Laundry) => void;
}

const LaundryCard = ({ laundry, onViewDetails }: LaundryCardProps) => {
  const handleCall = () => {
    if (laundry.contact_number) {
      window.open(`tel:${laundry.contact_number}`, '_self');
    }
  };

  const handleGetDirections = () => {
    if (laundry.latitude && laundry.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${laundry.latitude},${laundry.longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      {/* Photo Section */}
      {laundry.photos && laundry.photos.length > 0 ? (
        <div className="relative h-32 sm:h-40 md:h-48 overflow-hidden rounded-t-lg">
          <img
            src={laundry.photos[0]}
            alt={laundry.name}
            className="w-full h-full object-cover transition-transform hover:scale-105"
            loading="lazy"
            style={{ minHeight: '160px', backgroundColor: '#f3f4f6' }}
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          {laundry.photos.length > 1 && (
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-xs"
            >
              +{laundry.photos.length - 1} ფოტო
            </Badge>
          )}
        </div>
      ) : (
        <div className="h-32 sm:h-40 md:h-48 bg-muted flex items-center justify-center rounded-t-lg">
          <Image className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-muted-foreground" />
        </div>
      )}

      <CardHeader className="p-3 sm:p-4 md:p-6">
        <CardTitle className="text-base sm:text-lg font-semibold">{laundry.name}</CardTitle>
        {laundry.address && (
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="line-clamp-1">{laundry.address}</span>
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 pt-0">
        {laundry.description && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3">
            {laundry.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {laundry.water_price && (
            <Badge variant="outline" className="text-[10px] sm:text-xs">
              წყალი: {laundry.water_price}₾
            </Badge>
          )}
          {laundry.foam_price && (
            <Badge variant="outline" className="text-[10px] sm:text-xs">
              ქაფი: {laundry.foam_price}₾
            </Badge>
          )}
          {laundry.wax_price && (
            <Badge variant="outline" className="text-[10px] sm:text-xs">
              ცვილი: {laundry.wax_price}₾
            </Badge>
          )}
        </div>

        {laundry.box_count && (
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Car className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>ბოქსები: {laundry.box_count}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {laundry.contact_number && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCall}
              className="flex-1 text-xs sm:text-sm"
            >
              <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              დარეკვა
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleGetDirections}
            className="flex-1 text-xs sm:text-sm"
          >
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            მიმართულება
          </Button>
        </div>

        {onViewDetails && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onViewDetails(laundry)}
            className="w-full text-xs sm:text-sm"
          >
            დეტალები
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default LaundryCard;