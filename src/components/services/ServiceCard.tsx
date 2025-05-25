
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Clock, CreditCard, Banknote, Car, User } from "lucide-react";

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
    <Card className="h-full flex flex-col hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:scale-[1.02] bg-white rounded-xl overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg line-clamp-2 text-gray-900">{service.name}</CardTitle>
          {service.rating && (
            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-700">{service.rating.toFixed(1)}</span>
              {service.review_count && (
                <span className="text-xs text-yellow-600">({service.review_count})</span>
              )}
            </div>
          )}
        </div>
        
        {service.category && (
          <Badge variant="secondary" className="w-fit bg-primary/10 text-primary hover:bg-primary/20">
            {service.category.name}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex-grow pb-3 px-6">
        <div className="space-y-4">
          {service.description && (
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {service.description}
            </p>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{getLocationText()}</span>
            </div>

            {service.estimated_hours && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4 text-primary" />
                <span>{service.estimated_hours} საათი</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">{formatPrice(service.price_from, service.price_to)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {service.on_site_service && (
              <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                <Car className="h-3 w-3 mr-1" />
                მისვლით
              </Badge>
            )}
            {service.accepts_card_payment && (
              <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                <CreditCard className="h-3 w-3 mr-1" />
                ბარათი
              </Badge>
            )}
            {service.accepts_cash_payment && (
              <Badge variant="outline" className="text-xs border-gray-200 text-gray-700 bg-gray-50">
                <Banknote className="h-3 w-3 mr-1" />
                ნაღდი
              </Badge>
            )}
          </div>

          {service.car_brands && service.car_brands.length > 0 && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
              <span className="font-medium">მარკები: </span>
              {service.car_brands.slice(0, 3).join(", ")}
              {service.car_brands.length > 3 && "..."}
            </div>
          )}

          <div className="border-t border-gray-100 pt-3">
            <Link 
              to={`/mechanic/${service.mechanic.id}`}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors group"
            >
              <User className="h-4 w-4 text-primary" />
              <span className="group-hover:underline">
                {service.mechanic.first_name} {service.mechanic.last_name}
              </span>
              {service.mechanic.rating && (
                <div className="flex items-center gap-1 ml-auto">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{service.mechanic.rating.toFixed(1)}</span>
                </div>
              )}
            </Link>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 px-6 pb-6">
        <Link to={`/service/${service.id}`} className="w-full">
          <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg py-2.5 font-medium transition-colors">
            დეტალების ნახვა
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;
