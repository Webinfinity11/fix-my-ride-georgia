import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Edit } from "lucide-react";

interface FuelBrand {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  display_order: number;
}

export const AdminFuelBrands = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<FuelBrand | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    description: "",
    display_order: 0,
  });

  const { data: brands, isLoading } = useQuery({
    queryKey: ["admin-fuel-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fuel_brands")
        .select("*")
        .order("display_order");

      if (error) throw error;
      return data as FuelBrand[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingBrand) {
        const { error } = await supabase
          .from("fuel_brands")
          .update(data)
          .eq("id", editingBrand.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("fuel_brands")
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-fuel-brands"] });
      toast.success(editingBrand ? "ბრენდი განახლდა" : "ბრენდი დაემატა");
      setOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("fuel_brands")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-fuel-brands"] });
      toast.success("ბრენდი წაიშალა");
    },
  });

  const resetForm = () => {
    setFormData({ name: "", logo_url: "", description: "", display_order: 0 });
    setEditingBrand(null);
  };

  const handleEdit = (brand: FuelBrand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      logo_url: brand.logo_url || "",
      description: brand.description || "",
      display_order: brand.display_order,
    });
    setOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>საწვავის ბრენდების მართვა</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              ბრენდის დამატება
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBrand ? "ბრენდის რედაქტირება" : "ახალი ბრენდი"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>დასახელება *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="მაგ: Gulf, Socar"
                />
              </div>
              <div>
                <Label>ლოგოს URL</Label>
                <Input
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>აღწერა</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="მოკლე აღწერა..."
                />
              </div>
              <div>
                <Label>რიგითობა</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>
              <Button 
                onClick={() => saveMutation.mutate(formData)}
                disabled={!formData.name || saveMutation.isPending}
                className="w-full"
              >
                {saveMutation.isPending ? "შენახვა..." : "შენახვა"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {brands?.map((brand) => (
            <div key={brand.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                {brand.logo_url && (
                  <img src={brand.logo_url} alt={brand.name} className="w-12 h-12 object-contain" />
                )}
                <div>
                  <p className="font-medium">{brand.name}</p>
                  <p className="text-sm text-muted-foreground">{brand.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(brand)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => deleteMutation.mutate(brand.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
