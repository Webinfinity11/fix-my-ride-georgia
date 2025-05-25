
import { Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, Check, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// Type definition for mechanic
type MechanicProps = {
  id: string;
  name: string;
  avatar?: string;
  specialization: string;
  location: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  services: string[];
  // Additional optional properties
  isMobile?: boolean;
  experience?: number;
  description?: string;
};

const MechanicCard = ({
  id,
  name,
  avatar,
  specialization,
  location,
  rating,
  reviewCount,
  verified,
  services,
  // Additional props
  isMobile,
  experience,
  description,
}: MechanicProps) => {
  const { createDirectChat } = useChat();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Generate initials from name for avatar fallback
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("");

  const handleStartChat = async () => {
    if (!user) {
      toast.error("ჩატისთვის საჭიროა ავტორიზაცია");
      navigate("/login");
      return;
    }

    await createDirectChat(id);
    navigate("/chat");
    toast.success("ჩატი გახსნილია");
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden card-hover">
      <div className="p-6">
        <div className="flex items-start">
          {/* Avatar */}
          <Avatar className="h-16 w-16 rounded-full mr-4">
            <AvatarImage src={avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            {/* Name and verification */}
            <div className="flex items-center mb-1">
              <h3 className="text-lg font-semibold mr-2">{name}</h3>
              {verified && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
                  <Check className="h-3 w-3 mr-1" /> დადასტურებული
                </Badge>
              )}
            </div>
            
            {/* Specialization */}
            <p className="text-sm text-muted-foreground mb-2">{specialization}</p>
            
            {/* Location */}
            <div className="flex items-center text-sm text-gray-500 mb-3">
              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
              <span>{location}</span>
            </div>
            
            {/* Rating */}
            <div className="flex items-center mb-4">
              <div className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-sm">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 mr-1" />
                <span className="font-medium">{rating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-gray-500 ml-2">({reviewCount} შეფასება)</span>
            </div>
            
            {/* Services */}
            <div className="flex flex-wrap gap-2">
              {services.slice(0, 3).map((service, index) => (
                <Badge key={index} variant="secondary" className="bg-muted text-muted-foreground">
                  {service}
                </Badge>
              ))}
              {services.length > 3 && (
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  +{services.length - 3} მეტი
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Action footer */}
      <div className="bg-muted px-6 py-3 flex justify-between items-center gap-3">
        <Link 
          to={`/mechanic/${id}`} 
          className="text-primary font-medium hover:text-primary-light transition-colors"
        >
          ნახეთ პროფილი
        </Link>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleStartChat}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            მიწერა
          </Button>
          <Link
            to={`/book/${id}`}
            className="bg-secondary hover:bg-secondary/90 text-white px-4 py-1.5 rounded text-sm font-medium"
          >
            დაჯავშნა
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MechanicCard;
