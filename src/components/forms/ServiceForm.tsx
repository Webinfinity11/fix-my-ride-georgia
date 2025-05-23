import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ServiceType = {
  id: number;
  name: string;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  estimated_hours: number | null;
  category_id: number | null;
  is_active: boolean;
};

type CategoryType = {
  id: number;
  name: string;
  description?: string | null;
};

interface ServiceFormProps {
  service: ServiceType | null;
  categories: CategoryType[];  // Added this prop
  onSubmit: () => void;
  onCancel: () => void;
}

const ServiceForm = ({ service, categories, onSubmit, onCancel }: ServiceFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    priceFrom: "",
    priceTo: "",
    estimatedHours: "",
    categoryId: "",
    isActive: true,
  });

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name,
        description: service.description || "",
        priceFrom: service.price_from?.toString() || "",
        priceTo: service.price_to?.toString() || "",
        estimatedHours: service.estimated_hours?.toString() || "",
        categoryId: service.category_id?.toString() || "",
        isActive: service.is_active,
      });
    }
  }, [service]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setForm((prev) => ({ ...prev, categoryId: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setForm((prev) => ({ ...prev, isActive: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    
    try {
      if (!form.name) {
        throw new Error("გთხოვთ შეავსოთ სერვისის სახელი");
      }
      
      const serviceData = {
        mechanic_id: user.id,
        name: form.name,
        description: form.description || null,
        price_from: form.priceFrom ? parseFloat(form.priceFrom) : null,
        price_to: form.priceTo ? parseFloat(form.priceTo) : null,
        estimated_hours: form.estimatedHours ? parseInt(form.estimatedHours) : null,
        category_id: form.categoryId ? parseInt(form.categoryId) : null,
        is_active: form.isActive,
      };
      
      if (service) {
        // Update existing service
        const { error } = await supabase
          .from("mechanic_services")
          .update(serviceData)
          .eq("id", service.id)
          .eq("mechanic_id", user.id);
        
        if (error) throw error;
        
        toast.success("სერვისი განახლდა");
      } else {
        // Create new service
        const { error } = await supabase
          .from("mechanic_services")
          .insert(serviceData);
        
        if (error) throw error;
        
        toast.success("სერვისი დაემატა");
      }
      
      onSubmit();
    } catch (error: any) {
      toast.error(`სერვისის შენახვა ვერ მოხერხდა: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {service ? "სერვისის რედაქტირება" : "ახალი სერვისის დამატება"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">სერვისის დასახელება</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="მაგ: ძრავის ზეთის შეცვლა"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">აღწერა</Label>
            <Textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="სერვისის დეტალური აღწერა"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId">კატეგორია</Label>
              <Select
                value={form.categoryId}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="აირჩიეთ კატეგორია" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">სავარაუდო დრო (საათებში)</Label>
              <Input
                id="estimatedHours"
                name="estimatedHours"
                type="number"
                min="0.5"
                step="0.5"
                value={form.estimatedHours}
                onChange={handleChange}
                placeholder="მაგ: 2"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priceFrom">ფასი - დან (GEL)</Label>
              <Input
                id="priceFrom"
                name="priceFrom"
                type="number"
                min="0"
                value={form.priceFrom}
                onChange={handleChange}
                placeholder="მაგ: 50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priceTo">ფასი - მდე (GEL)</Label>
              <Input
                id="priceTo"
                name="priceTo"
                type="number"
                min="0"
                value={form.priceTo}
                onChange={handleChange}
                placeholder="მაგ: 100"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="isActive"
              checked={form.isActive}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              აქტიური სერვისი
            </Label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              გაუქმება
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "მიმდინარეობს..." : "შენახვა"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ServiceForm;
