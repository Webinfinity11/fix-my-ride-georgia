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
import { Plus, Edit, Trash2, Settings, Tag, MapPin, Building, Car, MessageCircle } from "lucide-react";
import ChatManagement from './ChatManagement';

type ServiceCategory = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
};

type City = {
  id: number;
  name: string;
  country: string | null;
};

type District = {
  id: number;
  name: string;
  city_id: number;
  city: { name: string };
};

type CarBrand = {
  id: number;
  name: string;
  logo_url: string | null;
  is_popular: boolean | null;
};

const ServiceManagement = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [carBrands, setCarBrands] = useState<CarBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("categories");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    country: "Georgia",
    city_id: "",
    logo_url: "",
    is_popular: false
  });

  const commonIcons = [
    "wrench", "car", "gear", "settings", "engine", "wheel", "battery", 
    "oil", "brake", "transmission", "exhaust", "air-conditioning", "electrical"
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

      // Fetch cities
      const { data: citiesData, error: citiesError } = await supabase
        .from("cities")
        .select("*")
        .order("name");

      if (citiesError) throw citiesError;
      setCities(citiesData || []);

      // Fetch districts with city names
      const { data: districtsData, error: districtsError } = await supabase
        .from("districts")
        .select("id, name, city_id, cities(name)")
        .order("name");

      if (districtsError) throw districtsError;
      setDistricts(districtsData?.map(d => ({
        id: d.id,
        name: d.name,
        city_id: d.city_id,
        city: { name: Array.isArray(d.cities) ? d.cities[0]?.name || "" : d.cities?.name || "" }
      })) || []);

      // Fetch car brands
      const { data: brandsData, error: brandsError } = await supabase
        .from("car_brands")
        .select("*")
        .order("name");

      if (brandsError) throw brandsError;
      setCarBrands(brandsData || []);

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
      } else if (activeTab === "cities") {
        const cityData = {
          name: formData.name,
          country: formData.country || "Georgia"
        };

        if (editingItem) {
          const { error } = await supabase
            .from("cities")
            .update(cityData)
            .eq("id", editingItem.id);
          
          if (error) throw error;
          toast.success("ქალაქი წარმატებით განახლდა");
        } else {
          const { error } = await supabase
            .from("cities")
            .insert([cityData]);
          
          if (error) throw error;
          toast.success("ქალაქი წარმატებით დაემატა");
        }
      } else if (activeTab === "districts") {
        const districtData = {
          name: formData.name,
          city_id: parseInt(formData.city_id)
        };

        if (editingItem) {
          const { error } = await supabase
            .from("districts")
            .update(districtData)
            .eq("id", editingItem.id);
          
          if (error) throw error;
          toast.success("უბანი წარმატებით განახლდა");
        } else {
          const { error } = await supabase
            .from("districts")
            .insert([districtData]);
          
          if (error) throw error;
          toast.success("უბანი წარმატებით დაემატა");
        }
      } else if (activeTab === "brands") {
        const brandData = {
          name: formData.name,
          logo_url: formData.logo_url || null,
          is_popular: formData.is_popular
        };

        if (editingItem) {
          const { error } = await supabase
            .from("car_brands")
            .update(brandData)
            .eq("id", editingItem.id);
          
          if (error) throw error;
          toast.success("მარკა წარმატებით განახლდა");
        } else {
          const { error } = await supabase
            .from("car_brands")
            .insert([brandData]);
          
          if (error) throw error;
          toast.success("მარკა წარმატებით დაემატა");
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
      let error;
      
      if (type === "category") {
        ({ error } = await supabase.from("service_categories").delete().eq("id", id));
        toast.success("კატეგორია წარმატებით წაიშალა");
      } else if (type === "city") {
        ({ error } = await supabase.from("cities").delete().eq("id", id));
        toast.success("ქალაქი წარმატებით წაიშალა");
      } else if (type === "district") {
        ({ error } = await supabase.from("districts").delete().eq("id", id));
        toast.success("უბანი წარმატებით წაიშალა");
      } else if (type === "brand") {
        ({ error } = await supabase.from("car_brands").delete().eq("id", id));
        toast.success("მარკა წარმატებით წაიშალა");
      }
      
      if (error) throw error;
      fetchData();
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
      country: "Georgia",
      city_id: "",
      logo_url: "",
      is_popular: false
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
        country: "Georgia",
        city_id: "",
        logo_url: "",
        is_popular: false
      });
    } else if (type === "city") {
      setFormData({
        name: item.name || "",
        description: "",
        icon: "",
        country: item.country || "Georgia",
        city_id: "",
        logo_url: "",
        is_popular: false
      });
    } else if (type === "district") {
      setFormData({
        name: item.name || "",
        description: "",
        icon: "",
        country: "Georgia",
        city_id: item.city_id?.toString() || "",
        logo_url: "",
        is_popular: false
      });
    } else if (type === "brand") {
      setFormData({
        name: item.name || "",
        description: "",
        icon: "",
        country: "Georgia",
        city_id: "",
        logo_url: item.logo_url || "",
        is_popular: item.is_popular || false
      });
    }
    setDialogOpen(true);
  };

  const openAddDialog = (type: string) => {
    setActiveTab(type);
    resetForm();
    setDialogOpen(true);
  };

  const renderDialogContent = () => {
    const isEditing = !!editingItem;
    
    return (
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

        {activeTab === "categories" && (
          <>
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
          </>
        )}

        {activeTab === "cities" && (
          <div>
            <Label htmlFor="country">ქვეყანა</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>
        )}

        {activeTab === "districts" && (
          <div>
            <Label htmlFor="city">ქალაქი *</Label>
            <Select value={formData.city_id} onValueChange={(value) => setFormData({ ...formData, city_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="აირჩიეთ ქალაქი" />
              </SelectTrigger>
              <SelectContent>
                {cities.map(city => (
                  <SelectItem key={city.id} value={city.id.toString()}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {activeTab === "brands" && (
          <>
            <div>
              <Label htmlFor="logo_url">ლოგოს URL</Label>
              <Input
                id="logo_url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_popular"
                checked={formData.is_popular}
                onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
              />
              <Label htmlFor="is_popular">პოპულარული მარკა</Label>
            </div>
          </>
        )}

        <div className="flex gap-2">
          <Button type="submit">
            {isEditing ? "განახლება" : "დამატება"}
          </Button>
          <Button type="button" variant="outline" onClick={resetForm}>
            გაუქმება
          </Button>
        </div>
      </form>
    );
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
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Settings className="h-5 w-5 md:h-6 md:w-6" />
          <span className="hidden sm:inline">სერვისის დეტალები</span>
          <span className="sm:hidden">დეტალები</span>
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto">
          <TabsTrigger value="categories" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3">
            <Tag className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">კატეგორიები</span>
            <span className="sm:hidden">კატ.</span>
          </TabsTrigger>
          <TabsTrigger value="cities" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3">
            <MapPin className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">ქალაქები</span>
            <span className="sm:hidden">ქალ.</span>
          </TabsTrigger>
          <TabsTrigger value="districts" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3">
            <Building className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">უბნები</span>
            <span className="sm:hidden">უბნ.</span>
          </TabsTrigger>
          <TabsTrigger value="brands" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3">
            <Car className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">მარკები</span>
            <span className="sm:hidden">მარკ.</span>
          </TabsTrigger>
          <TabsTrigger value="chats" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3 col-span-3 md:col-span-1">
            <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">ჩატები</span>
            <span className="sm:hidden">ჩატ.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
              <CardTitle className="text-lg md:text-xl">სერვისის კატეგორიები</CardTitle>
              <Dialog open={dialogOpen && activeTab === "categories"} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openAddDialog("categories")} size="sm" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="text-xs md:text-sm">ახალი კატეგორია</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg">
                      {editingItem ? "კატეგორიის რედაქტირება" : "ახალი კატეგორია"}
                    </DialogTitle>
                  </DialogHeader>
                  {renderDialogContent()}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-3 md:p-6">
              <div className="grid gap-3 md:gap-4">
                {categories.map(category => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm md:text-base truncate">{category.name}</h4>
                      {category.description && (
                        <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">{category.description}</p>
                      )}
                      {category.icon && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {category.icon}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1 md:gap-2 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(category, "category")}
                        className="p-2"
                      >
                        <Edit className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="p-2">
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="w-[95vw] max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg">კატეგორიის წაშლა</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm">
                              დარწმუნებული ხართ, რომ გსურთ "{category.name}" კატეგორიის წაშლა?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto">გაუქმება</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(category.id, "category")} className="w-full sm:w-auto">
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
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
              <CardTitle className="text-lg md:text-xl">ქალაქები</CardTitle>
              <Dialog open={dialogOpen && activeTab === "cities"} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openAddDialog("cities")} size="sm" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="text-xs md:text-sm">ახალი ქალაქი</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg">
                      {editingItem ? "ქალაქის რედაქტირება" : "ახალი ქალაქი"}
                    </DialogTitle>
                  </DialogHeader>
                  {renderDialogContent()}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-3 md:p-6">
              <div className="grid gap-3 md:gap-4">
                {cities.map(city => (
                  <div key={city.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm md:text-base truncate">{city.name}</h4>
                      <p className="text-xs md:text-sm text-muted-foreground">{city.country}</p>
                    </div>
                    <div className="flex gap-1 md:gap-2 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(city, "city")}
                        className="p-2"
                      >
                        <Edit className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="p-2">
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="w-[95vw] max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg">ქალაქის წაშლა</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm">
                              დარწმუნებული ხართ, რომ გსურთ "{city.name}" ქალაქის წაშლა?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto">გაუქმება</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(city.id, "city")} className="w-full sm:w-auto">
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

        <TabsContent value="districts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
              <CardTitle className="text-lg md:text-xl">უბნები</CardTitle>
              <Dialog open={dialogOpen && activeTab === "districts"} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openAddDialog("districts")} size="sm" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="text-xs md:text-sm">ახალი უბანი</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg">
                      {editingItem ? "უბნის რედაქტირება" : "ახალი უბანი"}
                    </DialogTitle>
                  </DialogHeader>
                  {renderDialogContent()}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-3 md:p-6">
              <div className="grid gap-3 md:gap-4">
                {districts.map(district => (
                  <div key={district.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm md:text-base truncate">{district.name}</h4>
                      <p className="text-xs md:text-sm text-muted-foreground">{district.city.name}</p>
                    </div>
                    <div className="flex gap-1 md:gap-2 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(district, "district")}
                        className="p-2"
                      >
                        <Edit className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="p-2">
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="w-[95vw] max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg">უბნის წაშლა</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm">
                              დარწმუნებული ხართ, რომ გსურთ "{district.name}" უბნის წაშლა?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto">გაუქმება</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(district.id, "district")} className="w-full sm:w-auto">
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

        <TabsContent value="brands" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
              <CardTitle className="text-lg md:text-xl">ავტომობილის მარკები</CardTitle>
              <Dialog open={dialogOpen && activeTab === "brands"} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openAddDialog("brands")} size="sm" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="text-xs md:text-sm">ახალი მარკა</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg">
                      {editingItem ? "მარკის რედაქტირება" : "ახალი მარკა"}
                    </DialogTitle>
                  </DialogHeader>
                  {renderDialogContent()}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-3 md:p-6">
              <div className="grid gap-3 md:gap-4">
                {carBrands.map(brand => (
                  <div key={brand.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                      {brand.logo_url && (
                        <img src={brand.logo_url} alt={brand.name} className="h-6 w-6 md:h-8 md:w-8 object-contain flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm md:text-base truncate">{brand.name}</h4>
                        {brand.is_popular && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            პოპულარული
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 md:gap-2 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(brand, "brand")}
                        className="p-2"
                      >
                        <Edit className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="p-2">
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="w-[95vw] max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg">მარკის წაშლა</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm">
                              დარწმუნებული ხართ, რომ გსურთ "{brand.name}" მარკის წაშლა?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto">გაუქმება</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(brand.id, "brand")} className="w-full sm:w-auto">
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

        <TabsContent value="chats" className="space-y-4">
          <ChatManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceManagement;
