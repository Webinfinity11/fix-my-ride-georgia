import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, Car, CreditCard, Banknote, ExternalLink, Phone, ImageOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { createServiceSlug, createMechanicSlug } from "@/utils/slugUtils";

interface ServiceType {
  id: number;
  name: string;
  slug?: string | null;
  description: string | null;
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
    display_id?: number;
    first_name: string;
    last_name: string;
    rating: number | null;
    phone_number?: string | null;
  };
}

interface ServiceCardProps {
  service: ServiceType;
  onMapFocus?: () => void;
}

const ServiceCard = ({ service, onMapFocus }: ServiceCardProps) => {
  const navigate = useNavigate();
  const [showPhone, setShowPhone] = useState(false);

  const handleViewDetails = () => {
    const slug = createServiceSlug(service.id, service.name);
    navigate(`/service/${slug}`);
  };

  const handleViewMechanic = (e: React.MouseEvent) => {
    e.stopPropagation();
    const mechanicSlug = createMechanicSlug(
      service.mechanic.display_id || 0, 
      service.mechanic.first_name, 
      service.mechanic.last_name
    );
    navigate(`/mechanic/${mechanicSlug}`);
  };

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!service.mechanic.phone_number) {
      return;
    }

    if (!showPhone) {
      // First click - show phone number
      setShowPhone(true);
    } else {
      // Second click - make the call
      window.location.href = `tel:${service.mechanic.phone_number}`;
    }
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

  const formatPhoneNumber = (phone: string) => {
    // Format Georgian phone numbers nicely
    if (phone.startsWith('+995')) {
      return phone.replace('+995', '+995 ').replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    }
    return phone;
  };

  // Check if service has photos and get the first one
  const hasPhotos = service.photos && service.photos.length > 0;
  const mainPhoto = hasPhotos ? service.photos[0] : null;

  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger map focus if clicking on the card background (not on interactive elements)
    const target = e.target as HTMLElement;
    if (
      !target.closest('button') && 
      !target.closest('h3') && 
      !target.closest('[role="button"]') &&
      !target.closest('.image-container') &&
      onMapFocus
    ) {
      onMapFocus();
    }
  };

  return (
    <Card className="group border-primary/20 hover:border-primary/40 transition-all duration-200 hover:shadow-lg rounded-lg">
      <CardContent className="p-0" onClick={handleCardClick}>
        {/* Main Photo or Placeholder */}
        <div className="relative overflow-hidden cursor-pointer image-container rounded-t-lg" onClick={handleViewDetails}>
          {mainPhoto ? (
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={mainPhoto}
                alt={service.name}
                width="300"
                height="225"
                loading={onMapFocus ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={onMapFocus ? "high" : "auto"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
          ) : (
            <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 to-primary/10 flex flex-col items-center justify-center border-b border-primary/10">
              <div className="text-primary/30 mb-2">
                <ImageOff size={48} />
              </div>
              <div className="text-primary/60 text-sm font-medium">
                Fixup.ge
              </div>
              <div className="text-primary/40 text-xs mt-1">
                სერვისის ფოტო
              </div>
            </div>
          )}
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

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Call Button */}
            {service.mechanic.phone_number && (
              <Button 
                onClick={handlePhoneClick}
                variant="outline"
                className="flex-1 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-600 transition-colors"
              >
                <Phone className="w-4 h-4 mr-2" />
                {showPhone ? formatPhoneNumber(service.mechanic.phone_number) : "დარეკვა"}
              </Button>
            )}
            
            {/* Details Button */}
            <Button 
              onClick={handleViewDetails} 
              className="flex-1 bg-primary hover:bg-primary-light transition-colors"
            >
              დეტალების ნახვა
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;