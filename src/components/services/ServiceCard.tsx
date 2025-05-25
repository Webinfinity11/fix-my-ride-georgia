
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Clock, CreditCard, Banknote, Car } from "lucide-react";

type ServiceType = {
  id: number;
  name: string;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  estimated_hours: number | null;
  city: string | null;
  district: string | null;
  car_brands: string[] | null;
  on_site_service: boolean;
  accepts_card_payment: boolean;
  accepts_cash_payment: boolean;
  rating: number | null;
  review_count: number | null;
  category: {
    id: number;
    name: string;
  } | null;
  mechanic: {
    id: string;
    first_name: string;
    last_name: string;
    rating: number | null;
  };
};

interface ServiceCardProps {
  service: ServiceType;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const formatPrice = (priceFrom: number | null, priceTo: number | null) => {
    if (!priceFrom && !priceTo) return "ფასი შეთანხმებით";
    if (priceFrom && priceTo && priceFrom !== priceTo) {
      return `${priceFrom}-${priceTo} ₾`;
    }
    return `${priceFrom || priceTo} ₾`;
  };

  const getLocationText = () => {
    if (service.city && service.district) {
      return `${service.city}, ${service.district}`;
    }
    return service.city || "მდებარეობა მითითებული არ არის";
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg line-clamp-2">{service.name}</CardTitle>
          {service.rating && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{service.rating.toFixed(1)}</span>
              {service.review_count && (
                <span className="text-muted-foreground">({service.review_count})</span>
              )}
            </div>
          )}
        </div>
        
        {service.category && (
          <Badge variant="secondary" className="w-fit">
            {service.category.name}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex-grow pb-3">
        <div className="space-y-3">
          {service.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {service.description}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{getLocationText()}</span>
            </div>

            {service.estimated_hours && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{service.estimated_hours} საათი</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-primary">{formatPrice(service.price_from, service.price_to)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {service.on_site_service && (
              <Badge variant="outline" className="text-xs">
                <Car className="h-3 w-3 mr-1" />
                მისვლით
              </Badge>
            )}
            {service.accepts_card_payment && (
              <Badge variant="outline" className="text-xs">
                <CreditCard className="h-3 w-3 mr-1" />
                ბარათი
              </Badge>
            )}
            {service.accepts_cash_payment && (
              <Badge variant="outline" className="text-xs">
                <Banknote className="h-3 w-3 mr-1" />
                ნაღდი
              </Badge>
            )}
          </div>

          {service.car_brands && service.car_brands.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">მარკები: </span>
              {service.car_brands.slice(0, 3).join(", ")}
              {service.car_brands.length > 3 && "..."}
            </div>
          )}

          <div className="text-sm">
            <span className="text-muted-foreground">ხელოსანი: </span>
            <Link 
              to={`/mechanic/${service.mechanic.id}`}
              className="text-primary hover:underline font-medium"
            >
              {service.mechanic.first_name} {service.mechanic.last_name}
            </Link>
            {service.mechanic.rating && (
              <span className="text-muted-foreground text-xs ml-2">
                ★ {service.mechanic.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <Link to={`/service/${service.id}`} className="w-full">
          <Button className="w-full">
            დეტალების ნახვა
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;
