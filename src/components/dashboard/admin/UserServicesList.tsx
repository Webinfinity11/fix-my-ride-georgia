
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, MapPin, Star } from "lucide-react";
import { useState } from "react";
import EditServiceDialog from "@/components/dashboard/mechanic/EditServiceDialog";

interface Service {
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
  is_active: boolean;
  rating: number | null;
  review_count: number | null;
  category: {
    id: number;
    name: string;
  } | null;
}

interface UserServicesListProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserServicesList = ({ userId, userName, open, onOpenChange }: UserServicesListProps) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: services, isLoading, refetch } = useQuery({
    queryKey: ['user-services', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mechanic_services')
        .select(`
          *,
          category:service_categories(id, name)
        `)
        .eq('mechanic_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Service[];
    },
    enabled: open,
  });

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setEditDialogOpen(true);
  };

  const handleServiceUpdated = () => {
    refetch();
    setEditDialogOpen(false);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{userName}-ის სერვისები</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{userName}-ის სერვისები ({services?.length || 0})</DialogTitle>
          </DialogHeader>
          
          {services?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              ამ მომხმარებელს არ აქვს დამატებული სერვისები
            </div>
          ) : (
            <div className="space-y-4">
              {services?.map((service) => (
                <Card key={service.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        {service.category && (
                          <Badge variant="outline">{service.category.name}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={service.is_active ? "default" : "secondary"}>
                          {service.is_active ? "აქტიური" : "გათიშული"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditService(service)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          რედაქტირება
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {service.description && (
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm">
                      {(service.price_from || service.price_to) && (
                        <div>
                          <span className="font-medium">ფასი: </span>
                          {service.price_from && service.price_to
                            ? `₾${service.price_from} - ₾${service.price_to}`
                            : service.price_from
                            ? `₾${service.price_from}-დან`
                            : `₾${service.price_to}-მდე`
                          }
                        </div>
                      )}
                      
                      {service.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {service.city}
                          {service.district && `, ${service.district}`}
                        </div>
                      )}
                      
                      {service.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {service.rating} ({service.review_count || 0})
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EditServiceDialog
        service={selectedService}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onServiceUpdated={handleServiceUpdated}
      />
    </>
  );
};

export default UserServicesList;
