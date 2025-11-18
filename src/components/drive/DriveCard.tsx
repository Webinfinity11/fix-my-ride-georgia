import { MapPin, Phone, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Drive = Database["public"]["Tables"]["drives"]["Row"];

interface DriveCardProps {
  drive: Drive;
  onClick?: () => void;
}

export const DriveCard = ({ drive, onClick }: DriveCardProps) => {
  const firstPhoto = drive.photos && drive.photos.length > 0 ? drive.photos[0] : null;

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {firstPhoto && (
        <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
          <img
            src={firstPhoto}
            alt={drive.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-1">{drive.name}</CardTitle>
          <Badge variant="secondary" className="shrink-0">
            <ImageIcon className="h-3 w-3 mr-1" />
            {drive.photos?.length || 0}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {drive.address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{drive.address}</span>
          </div>
        )}

        {drive.contact_number && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span>{drive.contact_number}</span>
          </div>
        )}

        {drive.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {drive.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
