
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wrench, Edit, Trash2, Plus, Eye, EyeOff, MapPin, Clock, CreditCard, Banknote, Car, Star } from "lucide-react";

interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}

interface MechanicService {
  id: number;
  name: string;
  description?: string;
  price_from?: number;
  price_to?: number;
  estimated_hours?: number;
  is_active: boolean;
  on_site_service: boolean;
  accepts_cash_payment: boolean;
  accepts_card_payment: boolean;
  car_brands?: string[];
  category_id?: number;
  custom_category?: string;
  city?: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  working_days?: string[];
  working_hours_start?: string;
  working_hours_end?: string;
  photos?: string[];
  videos?: string[];
  rating?: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  mechanic_id: string;
  service_categories?: ServiceCategory;
  mechanic_profiles?: {
    id: string;
    profiles?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

const ServiceManagement = () => {
  const [services, setServices] = useState<MechanicService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<MechanicService | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    custom_category: "",
    price_from: "",
    price_to: "",
    estimated_hours: "",
    is_active: true,
    on_site_service: false,
    accepts_cash_payment: true,
    accepts_card_payment: false,
    car_brands: [] as string[],
    city: "",
    district: "",
    address: "",
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"] as string[],
    working_hours_start: "09:00",
    working_hours_end: "18:00"
  });

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data: servicesData, error } = await supabase
        .from('mechanic_services')
        .select(`
          *,
          service_categories(id, name, description, icon),
          mechanic_profiles!mechanic_id(
            id,
            profiles!mechanic_profiles_id_fkey(
              first_name,
              last_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setServices(servicesData || []);
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast.error('სერვისების ჩატვირთვისას შეცდომა დაფიქსირდა');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const serviceData = {
        name: formData.name,
        description: formData.description || null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        custom_category: formData.custom_category || null,
        price_from: formData.price_from ? parseFloat(formData.price_from) : null,
        price_to: formData.price_to ? parseFloat(formData.price_to) : null,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
        is_active: formData.is_active,
        on_site_service: formData.on_site_service,
        accepts_cash_payment: formData.accepts_cash_payment,
        accepts_card_payment: formData.accepts_card_payment,
        car_brands: formData.car_brands,
        city: formData.city || null,
        district: formData.district || null,
        address: formData.address || null,
        working_days: formData.working_days,
        working_hours_start: formData.working_hours_start,
        working_hours_end: formData.working_hours_end
      };

      if (editingService) {
        const { error } = await supabase
          .from('mechanic_services')
          .update(serviceData)
          .eq('id', editingService.id);
        
        if (error) throw error;
        toast.success('სერვისი წარმატებით განახლდა');
      } else {
        const { error } = await supabase
          .from('mechanic_services')
          .insert([serviceData]);
        
        if (error) throw error;
        toast.success('სერვისი წარმატებით შეიქმნა');
      }

      resetForm();
      fetchServices();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('შეცდომა: ' + error.message);
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    try {
      const { error } = await supabase
        .from('mechanic_services')
        .delete()
        .eq('id', serviceId);
      
      if (error) throw error;
      
      toast.success('სერვისი წარმატებით წაიშალა');
      fetchServices();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error('სერვისის წაშლისას შეცდომა დაფიქსირდა');
    }
  };

  const toggleServiceStatus = async (serviceId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('mechanic_services')
        .update({ is_active: !currentStatus })
        .eq('id', serviceId);
      
      if (error) throw error;
      
      toast.success(`სერვისი ${!currentStatus ? 'გააქტიურდა' : 'დეაქტიურდა'}`);
      fetchServices();
    } catch (error: any) {
      console.error('Error toggling service status:', error);
      toast.error('სტატუსის შეცვლისას შეცდომა დაფიქსირდა');
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category_id: "",
      custom_category: "",
      price_from: "",
      price_to: "",
      estimated_hours: "",
      is_active: true,
      on_site_service: false,
      accepts_cash_payment: true,
      accepts_card_payment: false,
      car_brands: [],
      city: "",
      district: "",
      address: "",
      working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      working_hours_start: "09:00",
      working_hours_end: "18:00"
    });
    setEditingService(null);
    setDialogOpen(false);
  };

  const openEditDialog = (service: MechanicService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      category_id: service.category_id?.toString() || "",
      custom_category: service.custom_category || "",
      price_from: service.price_from?.toString() || "",
      price_to: service.price_to?.toString() || "",
      estimated_hours: service.estimated_hours?.toString() || "",
      is_active: service.is_active,
      on_site_service: service.on_site_service,
      accepts_cash_payment: service.accepts_cash_payment,
      accepts_card_payment: service.accepts_card_payment,
      car_brands: service.car_brands || [],
      city: service.city || "",
      district: service.district || "",
      address: service.address || "",
      working_days: service.working_days || ["monday", "tuesday", "wednesday", "thursday", "friday"],
      working_hours_start: service.working_hours_start || "09:00",
      working_hours_end: service.working_hours_end || "18:00"
    });
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
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Wrench className="h-6 w-6" />
          სერვისების მართვა
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              ახალი სერვისი
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "სერვისის რედაქტირება" : "ახალი სერვისი"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name">სერვისის სახელი</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="მაგ. ზეთის შეცვლა"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">აღწერა</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="სერვისის დეტალური აღწერა"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="category">კატეგორია</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger>
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

                <div>
                  <Label htmlFor="custom_category">საკუთარი კატეგორია</Label>
                  <Input
                    id="custom_category"
                    value={formData.custom_category}
                    onChange={(e) => setFormData({ ...formData, custom_category: e.target.value })}
                    placeholder="ან მიუთითეთ საკუთარი"
                  />
                </div>

                <div>
                  <Label htmlFor="price_from">ფასი (დან)</Label>
                  <Input
                    id="price_from"
                    type="number"
                    value={formData.price_from}
                    onChange={(e) => setFormData({ ...formData, price_from: e.target.value })}
                    placeholder="მინ. ფასი"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="price_to">ფასი (მდე)</Label>
                  <Input
                    id="price_to"
                    type="number"
                    value={formData.price_to}
                    onChange={(e) => setFormData({ ...formData, price_to: e.target.value })}
                    placeholder="მაქს. ფასი"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="estimated_hours">სავარაუდო საათები</Label>
                  <Input
                    id="estimated_hours"
                    type="number"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                    placeholder="მაგ. 2"
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="city">ქალაქი</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="მაგ. თბილისი"
                  />
                </div>

                <div>
                  <Label htmlFor="district">რაიონი</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="მაგ. ვაკე"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">მისამართი</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="ზუსტი მისამართი"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <Label htmlFor="is_active">აქტიური</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="on_site_service"
                      checked={formData.on_site_service}
                      onChange={(e) => setFormData({ ...formData, on_site_service: e.target.checked })}
                    />
                    <Label htmlFor="on_site_service">მობილური სერვისი</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="accepts_cash_payment"
                      checked={formData.accepts_cash_payment}
                      onChange={(e) => setFormData({ ...formData, accepts_cash_payment: e.target.checked })}
                    />
                    <Label htmlFor="accepts_cash_payment">ღებულობს ნაღდს</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="accepts_card_payment"
                      checked={formData.accepts_card_payment}
                      onChange={(e) => setFormData({ ...formData, accepts_card_payment: e.target.checked })}
                    />
                    <Label htmlFor="accepts_card_payment">ღებულობს ბარათს</Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingService ? "განახლება" : "შექმნა"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  გაუქმება
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ყველა სერვისი ({services.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-lg">{service.name}</h4>
                    <div className="flex gap-2">
                      <Badge variant={service.is_active ? 'default' : 'secondary'}>
                        {service.is_active ? 'აქტიური' : 'არააქტიური'}
                      </Badge>
                      {service.on_site_service && (
                        <Badge variant="outline">მობილური</Badge>
                      )}
                    </div>
                  </div>
                  
                  {service.description && (
                    <p className="text-sm text-gray-600">{service.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    {service.mechanic_profiles?.profiles && (
                      <div className="flex items-center gap-1">
                        <span>მექანიკი:</span>
                        <span>{service.mechanic_profiles.profiles.first_name} {service.mechanic_profiles.profiles.last_name}</span>
                      </div>
                    )}
                    
                    {(service.price_from || service.price_to) && (
                      <div className="flex items-center gap-1">
                        <span>ფასი:</span>
                        <span>
                          {service.price_from && service.price_to 
                            ? `${service.price_from} - ${service.price_to} ლარი`
                            : service.price_from 
                            ? `${service.price_from}+ ლარი`
                            : `${service.price_to} ლარამდე`
                          }
                        </span>
                      </div>
                    )}
                    
                    {service.estimated_hours && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{service.estimated_hours} საათი</span>
                      </div>
                    )}
                    
                    {(service.city || service.district) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{[service.city, service.district].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      {service.accepts_cash_payment && (
                        <div className="flex items-center gap-1">
                          <Banknote className="h-4 w-4" />
                          <span>ნაღდი</span>
                        </div>
                      )}
                      {service.accepts_card_payment && (
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          <span>ბარათი</span>
                        </div>
                      )}
                    </div>
                    
                    {service.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{service.rating.toFixed(1)} ({service.review_count})</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4 lg:mt-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleServiceStatus(service.id, service.is_active)}
                  >
                    {service.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(service)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>სერვისის წაშლა</AlertDialogTitle>
                        <AlertDialogDescription>
                          დარწმუნებული ხართ, რომ გსურთ ამ სერვისის წაშლა? ეს მოქმედება შეუქცევადია.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>გაუქმება</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteService(service.id)}>
                          წაშლა
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            
            {services.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                სერვისები არ მოიძებნა
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceManagement;
