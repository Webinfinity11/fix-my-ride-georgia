
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ServiceForm from "@/components/forms/ServiceForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Service {
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
  is_active: boolean;
  rating: number | null;
  review_count: number | null;
  category: {
    id: number;
    name: string;
  } | null;
}

interface ServiceCategory {
  id: number;
  name: string;
  description: string | null;
}

interface EditServiceDialogProps {
  service: Service | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServiceUpdated: () => void;
}

const EditServiceDialog = ({ service, open, onOpenChange, onServiceUpdated }: EditServiceDialogProps) => {
  const { data: categories = [] } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('id, name, description')
        .order('name');
      
      if (error) throw error;
      return data as ServiceCategory[];
    },
  });

  const handleSubmit = () => {
    onServiceUpdated();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!service) return null;

  // Transform service data to match ServiceForm expectations
  const formService = {
    id: service.id,
    name: service.name,
    description: service.description,
    price_from: service.price_from,
    price_to: service.price_to,
    estimated_hours: service.estimated_hours,
    category_id: service.category?.id || null,
    is_active: service.is_active,
    accepts_card_payment: service.accepts_card_payment,
    accepts_cash_payment: service.accepts_cash_payment,
    car_brands: service.car_brands,
    on_site_service: service.on_site_service,
    city: service.city,
    district: service.district,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>სერვისის რედაქტირება</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <ServiceForm
            service={formService}
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditServiceDialog;
