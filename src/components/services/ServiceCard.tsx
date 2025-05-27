
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, Car, CreditCard, Banknote, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ServiceGallery from "./ServiceGallery";

interface ServiceType {
  id: number;
  name: string;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  estimated_hours: number | null;
  city: string | null;
  district: string | null;
  address: string | null;
  car_brands: string[] | null;
  on_site_service: boolean;
  accepts_card_payment: boolean;
  accepts_cash_payment: boolean;
  rating: number | null;
  review_count: number | null;
  photos: string[] | null;
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
}

interface ServiceCardProps {
  service: ServiceType;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/service/${service.id}`);
  };

  const handleViewMechanic = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/mechanic/${service.mechanic.id}`);
  };

  const formatPrice = () => {
    if (service.price_from && service.price_to) {
      return `${service.price_from} - ${service.price_to} ₾`;
    } else if (service.price_from) {
      return `${service.price_from}₾-დან`;
    }
    return "ფასი შეთანხმებით";
  };

  const formatLocation = () => {
    if (service.address) {
      return service.address;
    } else if (service.city && service.district) {
      return `${service.city}, ${service.district}`;
    } else if (service.city) {
      return service.city;
    }
    return "მდებარეობა მითითებული არ არის";
  };

  return (
    <Card className="group border-primary/20 hover:border-primary/40 transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-0">
        {/* Service Gallery - Now clickable */}
        <div className="relative overflow-hidden cursor-pointer" onClick={handleViewDetails}>
          <ServiceGallery 
            photos={service.photos || []} 
            serviceName={service.name}
          />
        </div>

        <div className="p-4 space-y-3">
          {/* Header - Title is now clickable */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 
                className="font-semibold text-lg text-gray-900 group-hover:text-primary transition-colors line-clamp-2 cursor-pointer"
                onClick={handleViewDetails}
              >
                {service.name}
              </h3>
              {service.category && (
                <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                  {service.category.name}
                </Badge>
              )}
            </div>

            {service.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {service.description}
              </p>
            )}
          </div>

          {/* Price and Duration */}
          <div className="flex items-center justify-between">
            <div className="font-semibold text-lg text-primary">
              {formatPrice()}
            </div>
            {service.estimated_hours && (
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                {service.estimated_hours} საათი
              </div>
            )}
          </div>

          {/* Location */}
          <div className="flex items-start text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-1 text-primary flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{formatLocation()}</span>
          </div>

          {/* Mechanic Info */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {service.mechanic.first_name} {service.mechanic.last_name}
                </p>
                {service.mechanic.rating && (
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs text-gray-600">
                      {service.mechanic.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewMechanic}
              className="text-primary hover:bg-primary/5"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              პროფილი
            </Button>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2">
            {service.on_site_service && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                <Car className="w-3 h-3 mr-1" />
                ადგილზე მისვლა
              </Badge>
            )}
            {service.accepts_card_payment && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                <CreditCard className="w-3 h-3 mr-1" />
                ბარათი
              </Badge>
            )}
            {service.accepts_cash_payment && (
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">
                <Banknote className="w-3 h-3 mr-1" />
                ნაღდი
              </Badge>
            )}
          </div>

          {/* Car Brands */}
          {service.car_brands && service.car_brands.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500">მანქანის მარკები:</p>
              <div className="flex flex-wrap gap-1">
                {service.car_brands.slice(0, 3).map((brand, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {brand}
                  </Badge>
                ))}
                {service.car_brands.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{service.car_brands.length - 3} სხვა
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button 
            onClick={handleViewDetails} 
            className="w-full bg-primary hover:bg-primary-light transition-colors"
          >
            დეტალების ნახვა
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
