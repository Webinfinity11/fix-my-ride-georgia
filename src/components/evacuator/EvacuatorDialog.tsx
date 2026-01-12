import { useState } from "react";
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
import { useCreateEvacuatorRequest } from "@/hooks/useEvacuatorRequests";
import { Loader2, Truck } from "lucide-react";

interface EvacuatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EvacuatorDialog = ({ open, onOpenChange }: EvacuatorDialogProps) => {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    description: "",
  });

  const createRequest = useCreateEvacuatorRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRequest.mutateAsync({
      full_name: formData.full_name,
      phone: formData.phone,
      description: formData.description || undefined,
    });
    setFormData({
      full_name: "",
      phone: "",
      description: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <Truck className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-xl sm:text-2xl">ევაკუატორის გამოძახება</DialogTitle>
              <DialogDescription>
                შეავსეთ ფორმა და ჩვენ დაგიკავშირდებით უმოკლეს დროში
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">სახელი გვარი *</Label>
            <Input
              id="full_name"
              required
              placeholder="მაგ: გიორგი გიორგაძე"
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
              placeholder="მაგ: 599 123 456"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">დამატებითი დეტალები</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="მიუთითეთ მანქანის მოდელი, მდებარეობა და პრობლემის აღწერა..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
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
              disabled={createRequest.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {createRequest.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  იგზავნება...
                </>
              ) : (
                "გამოძახება"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
