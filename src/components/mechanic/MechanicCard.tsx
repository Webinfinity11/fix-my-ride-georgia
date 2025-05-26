
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Phone, Clock, DollarSign } from "lucide-react";
import { SendMessageButton } from "./SendMessageButton";

interface MechanicCardProps {
  mechanic: {
    id: string;
    profiles: {
      first_name: string;
      last_name: string;
      phone?: string;
      city?: string;
      district?: string;
      avatar_url?: string;
    };
    specialization?: string;
    hourly_rate?: number;
    rating?: number;
    review_count?: number;
    is_mobile?: boolean;
    working_hours?: any;
  };
}

export const MechanicCard: React.FC<MechanicCardProps> = ({ mechanic }) => {
  const fullName = `${mechanic.profiles.first_name} ${mechanic.profiles.last_name}`;
  const location = mechanic.profiles.city && mechanic.profiles.district 
    ? `${mechanic.profiles.city}, ${mechanic.profiles.district}`
    : mechanic.profiles.city || "მდებარეობა მითითებული არ არის";

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={mechanic.profiles.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {mechanic.profiles.first_name?.charAt(0)}{mechanic.profiles.last_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1 truncate">{fullName}</h3>
            {mechanic.specialization && (
              <p className="text-sm text-muted-foreground mb-2">{mechanic.specialization}</p>
            )}
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{location}</span>
            </div>

            {mechanic.rating && (
              <div className="flex items-center gap-1 mb-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{mechanic.rating}</span>
                <span className="text-sm text-muted-foreground">
                  ({mechanic.review_count || 0} შეფასება)
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {mechanic.hourly_rate && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4" />
              <span>{mechanic.hourly_rate} ₾/საათი</span>
            </div>
          )}

          {mechanic.is_mobile && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              ადგილზე მისვლა
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Link to={`/mechanic/${mechanic.id}`} className="flex-1">
          <Button variant="outline" className="w-full">
            დეტალები
          </Button>
        </Link>
        
        <SendMessageButton 
          mechanicId={mechanic.id}
          mechanicName={fullName}
          variant="default"
          size="default"
          className="flex-1"
        />
        
        {mechanic.profiles.phone && (
          <Button variant="ghost" size="icon" asChild>
            <a href={`tel:${mechanic.profiles.phone}`}>
              <Phone className="h-4 w-4" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
