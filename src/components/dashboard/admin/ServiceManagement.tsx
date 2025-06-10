
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Settings, Tag, MapPin, Building, Car } from "lucide-react";

type ServiceCategory = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
};

type CityData = {
  city: string;
  count: number;
};

type DistrictData = {
  district: string;
  city: string;
  count: number;
};

const ServiceManagement = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [cities, setCities] = useState<CityData[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("categories");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    city: "",
    district: ""
  });

  const commonIcons = [
    "wrench", "car", "gear", "settings", "engine", "wheel", "battery", 
    "oil", "brake", "transmission", "exhaust", "air-conditioning", "electrical"
  ];

  const commonCarBrands = [
    "BMW", "Mercedes-Benz", "Audi", "Toyota", "Honda", "Nissan", "Hyundai", 
    "Kia", "Volkswagen", "Ford", "Chevrolet", "Mazda", "Subaru", "Lexus"
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("service_categories")
        .select("*")
        .order("name");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch cities with service counts
      const { data: servicesData, error: servicesError } = await supabase
        .from("mechanic_services")
        .select("city, district")
        .not("city", "is", null);

      if (servicesError) throw servicesError;

      // Process cities data
      const cityMap = new Map<string, number>();
      const districtMap = new Map<string, { city: string; count: number }>();

      servicesData?.forEach(service => {
        if (service.city) {
          cityMap.set(service.city, (cityMap.get(service.city) || 0) + 1);
          
          if (service.district) {
            const key = `${service.city}-${service.district}`;
            districtMap.set(key, {
              city: service.city,
              count: (districtMap.get(key)?.count || 0) + 1
            });
          }
        }
      });

      const citiesArray = Array.from(cityMap.entries()).map(([city, count]) => ({
        city,
        count
      }));

      const districtsArray = Array.from(districtMap.entries()).map(([key, data]) => ({
        district: key.split('-')[1],
        city: data.city,
        count: data.count
      }));

      setCities(citiesArray);
      setDistricts(districtsArray);

    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("მონაცემების ჩატვირთვისას შეცდომა დაფიქსირდა");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (activeTab === "categories") {
        const categoryData = {
          name: formData.name,
          description: formData.description || null,
          icon: formData.icon || null
        };

        if (editingItem) {
          const { error } = await supabase
            .from("service_categories")
            .update(categoryData)
            .eq("id", editingItem.id);
          
          if (error) throw error;
          toast.success("კატეგორია წარმატებით განახლდა");
        } else {
          const { error } = await supabase
            .from("service_categories")
            .insert([categoryData]);
          
          if (error) throw error;
          toast.success("კატეგორია წარმატებით დაემატა");
        }
      }

      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("შეცდომა: " + error.message);
    }
  };

  const handleDelete = async (id: number, type: string) => {
    try {
      if (type === "category") {
        const { error } = await supabase
          .from("service_categories")
          .delete()
          .eq("id", id);
        
        if (error) throw error;
        toast.success("კატეგორია წარმატებით წაიშალა");
        fetchData();
      }
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast.error("წაშლისას შეცდომა დაფიქსირდა");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "",
      city: "",
      district: ""
    });
    setEditingItem(null);
    setDialogOpen(false);
  };

  const openEditDialog = (item: any, type: string) => {
    setEditingItem({ ...item, type });
    if (type === "category") {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        icon: item.icon || "",
        city: "",
        district: ""
      });
    }
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          სერვისის დეტალები
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            კატეგორიები
          </TabsTrigger>
          <TabsTrigger value="cities" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            ქალაქები
          </TabsTrigger>
          <TabsTrigger value="districts" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            უბნები
          </TabsTrigger>
          <TabsTrigger value="brands" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            მარკები
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>სერვისის კატეგორიები</CardTitle>
              <Dialog open={dialogOpen && activeTab === "categories"} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setActiveTab("categories")}>
                    <Plus className="h-4 w-4 mr-2" />
                    ახალი კატეგორია
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "კატეგორიის რედაქტირება" : "ახალი კატეგორია"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">დასახელება *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">აღწერა</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="icon">იკონა</Label>
                      <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="აირჩიეთ იკონა" />
                        </SelectTrigger>
                        <SelectContent>
                          {commonIcons.map(icon => (
                            <SelectItem key={icon} value={icon}>
                              {icon}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">
                        {editingItem ? "განახლება" : "დამატება"}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        გაუქმება
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {categories.map(category => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{category.name}</h4>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      )}
                      {category.icon && (
                        <Badge variant="outline" className="mt-1">
                          {category.icon}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(category, "category")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>კატეგორიის წაშლა</AlertDialogTitle>
                            <AlertDialogDescription>
                              დარწმუნებული ხართ, რომ გსურთ "{category.name}" კატეგორიის წაშლა?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(category.id, "category")}>
                              წაშლა
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ქალაქების სტატისტიკა</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {cities.map(cityData => (
                  <div key={cityData.city} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{cityData.city}</h4>
                      <p className="text-sm text-muted-foreground">
                        {cityData.count} სერვისი
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="districts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>უბნების სტატისტიკა</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {districts.map(districtData => (
                  <div key={`${districtData.city}-${districtData.district}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{districtData.district}</h4>
                      <p className="text-sm text-muted-foreground">
                        {districtData.city} - {districtData.count} სერვისი
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brands" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ავტომობილის მარკები</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {commonCarBrands.map(brand => (
                  <div key={brand} className="p-3 border rounded-lg text-center">
                    <p className="font-medium">{brand}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceManagement;
