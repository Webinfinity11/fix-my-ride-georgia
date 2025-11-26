import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreatePartsOrder } from "@/hooks/usePartsOrders";
import { Loader2 } from "lucide-react";

interface OrderPartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrderPartDialog = ({ open, onOpenChange }: OrderPartDialogProps) => {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    car_brand: "",
    car_model: "",
    car_year: "",
    engine_volume: "",
    part_name: "",
    part_description: "",
  });

  const createOrder = useCreatePartsOrder();

  const { data: carBrands } = useQuery({
    queryKey: ["car-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("car_brands")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createOrder.mutateAsync(formData);
    setFormData({
      full_name: "",
      phone: "",
      car_brand: "",
      car_model: "",
      car_year: "",
      engine_volume: "",
      part_name: "",
      part_description: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">შეუკვეთე ნაწილი</DialogTitle>
          <DialogDescription>
            შეავსეთ ფორმა და ჩვენ დაგიკავშირდებით უმოკლეს დროში
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">სახელი გვარი *</Label>
              <Input
                id="full_name"
                required
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">ტელეფონის ნომერი *</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>მანქანის მარკა *</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {carBrands?.map((brand) => (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, car_brand: brand.name })
                  }
                  className={`
                    p-3 rounded-lg border-2 transition-all
                    ${
                      formData.car_brand === brand.name
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }
                  `}
                >
                  {brand.logo_url ? (
                    <img
                      src={brand.logo_url}
                      alt={brand.name}
                      className="w-full h-8 object-contain"
                    />
                  ) : (
                    <span className="text-xs font-medium">{brand.name}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="car_model">მოდელი *</Label>
              <Input
                id="car_model"
                required
                value={formData.car_model}
                onChange={(e) =>
                  setFormData({ ...formData, car_model: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="car_year">წელი</Label>
              <Input
                id="car_year"
                placeholder="მაგ: 2020"
                value={formData.car_year}
                onChange={(e) =>
                  setFormData({ ...formData, car_year: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="engine_volume">ძრავის მოცულობა</Label>
              <Input
                id="engine_volume"
                placeholder="მაგ: 2.0"
                value={formData.engine_volume}
                onChange={(e) =>
                  setFormData({ ...formData, engine_volume: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="part_name">ნაწილის დასახელება *</Label>
            <Input
              id="part_name"
              required
              placeholder="მაგ: საჭე, ფილტრი, ზეთი..."
              value={formData.part_name}
              onChange={(e) =>
                setFormData({ ...formData, part_name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="part_description">აღწერა და დამატებითი დეტალები</Label>
            <Textarea
              id="part_description"
              rows={4}
              placeholder="დეტალური ინფორმაცია ნაწილის შესახებ..."
              value={formData.part_description}
              onChange={(e) =>
                setFormData({ ...formData, part_description: e.target.value })
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              გაუქმება
            </Button>
            <Button
              type="submit"
              disabled={createOrder.isPending}
              className="flex-1"
            >
              {createOrder.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  იგზავნება...
                </>
              ) : (
                "გაგზავნა"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
