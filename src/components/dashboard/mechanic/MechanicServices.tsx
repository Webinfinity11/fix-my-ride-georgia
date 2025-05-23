import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, Edit, Trash2, Plus, Tag, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ServiceForm from "@/components/forms/ServiceForm";

type ServiceType = {
  id: number;
  name: string;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  estimated_hours: number | null;
  category_id: number | null;
  is_active: boolean;
  category_name?: string;
};

type ServiceCategoryType = {
  id: number;
  name: string;
  description: string | null;
};

const MechanicServices = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [categories, setCategories] = useState<ServiceCategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<number | "all">("all");

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, [user]);

  const fetchServices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("mechanic_services")
        .select(`
          *,
          service_categories(name)
        `)
        .eq("mechanic_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to include category name
      const transformedData = data.map(service => ({
        ...service,
        category_name: service.service_categories?.name
      }));

      setServices(transformedData || []);
    } catch (error: any) {
      toast.error(`სერვისების ჩატვირთვა ვერ მოხერხდა: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("id, name, description")
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast.error(`კატეგორიების ჩატვირთვა ვერ მოხერხდა: ${error.message}`);
    }
  };

  const handleEdit = (service: ServiceType) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("დარწმუნებული ხართ, რომ გსურთ სერვისის წაშლა?")) return;

    try {
      const { error } = await supabase
        .from("mechanic_services")
        .delete()
        .eq("id", id)
        .eq("mechanic_id", user?.id);

      if (error) throw error;

      setServices(services.filter(service => service.id !== id));
      toast.success("სერვისი წაიშალა");
    } catch (error: any) {
      toast.error(`სერვისის წაშლა ვერ მოხერხდა: ${error.message}`);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("mechanic_services")
        .update({ is_active: !currentStatus })
        .eq("id", id)
        .eq("mechanic_id", user?.id);

      if (error) throw error;

      setServices(
        services.map(service =>
          service.id === id
            ? { ...service, is_active: !currentStatus }
            : service
        )
      );

      toast.success(
        `სერვისი ${!currentStatus ? "აქტიურია" : "არააქტიურია"}`
      );
    } catch (error: any) {
      toast.error(`სერვისის სტატუსის შეცვლა ვერ მოხერხდა: ${error.message}`);
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingService(null);
    fetchServices();
  };

  // Filter services based on search term and category filter
  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (service.category_name && service.category_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === "all" || service.category_id === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const activeServicesCount = services.filter(s => s.is_active).length;
  const inactiveServicesCount = services.filter(s => !s.is_active).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ჩემი სერვისები</h1>
        <Button onClick={() => { setEditingService(null); setShowForm(true); }}>
          <Plus size={16} className="mr-2" />
          დამატება
        </Button>
      </div>

      {showForm ? (
        <ServiceForm
          service={editingService}
          categories={categories}
          onSubmit={handleFormSubmit}
          onCancel={() => { setShowForm(false); setEditingService(null); }}
        />
      ) : (
        <>
          {services.length === 0 ? (
            <div className="bg-muted p-8 rounded-lg text-center">
              <Wrench size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">სერვისები არ არის</h3>
              <p className="text-muted-foreground mb-4">
                თქვენ ჯერ არ გაქვთ დამატებული სერვისები
              </p>
              <Button onClick={() => setShowForm(true)}>
                დაამატეთ პირველი სერვისი
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="სერვისის ძიება..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select 
                  value={filterCategory.toString()} 
                  onValueChange={(value) => setFilterCategory(value === "all" ? "all" : parseInt(value))}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="ყველა კატეგორია" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ყველა კატეგორია</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 mb-6">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="relative"
                  onClick={() => setFilterCategory("all")}
                >
                  ყველა
                  <Badge variant="secondary" className="ml-1">
                    {services.length}
                  </Badge>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="relative"
                >
                  აქტიური
                  <Badge variant="secondary" className="ml-1">
                    {activeServicesCount}
                  </Badge>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="relative"
                >
                  არააქტიური
                  <Badge variant="secondary" className="ml-1">
                    {inactiveServicesCount}
                  </Badge>
                </Button>
              </div>

              {filteredServices.length === 0 ? (
                <div className="text-center p-8 bg-muted rounded-lg">
                  <p className="text-muted-foreground">სერვისები ვერ მოიძებნა</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredServices.map((service) => (
                    <Card key={service.id} className={`border-l-4 ${service.is_active ? 'border-l-green-500' : 'border-l-gray-300'}`}>
                      <CardContent className="p-6">
                        <div className="flex justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-medium">{service.name}</h3>
                              <Badge
                                variant={service.is_active ? "secondary" : "outline"}
                                className={service.is_active ? "bg-green-100 text-green-800" : ""}
                              >
                                {service.is_active ? "აქტიური" : "არააქტიური"}
                              </Badge>
                            </div>
                            {service.category_name && (
                              <div className="flex items-center text-muted-foreground text-sm mt-1">
                                <Tag size={14} className="mr-1" />
                                {service.category_name}
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant={service.is_active ? "outline" : "default"}
                              size="sm"
                              onClick={() => handleToggleActive(service.id, service.is_active)}
                            >
                              {service.is_active ? "გამორთვა" : "ჩართვა"}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(service)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDelete(service.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                        
                        {service.description && (
                          <p className="mb-4 text-sm text-muted-foreground">
                            {service.description}
                          </p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ფასი:</span>
                            <span>
                              {service.price_from
                                ? service.price_to
                                  ? `${service.price_from} - ${service.price_to} GEL`
                                  : `${service.price_from} GEL`
                                : "ფასი განისაზღვრება ინდივიდუალურად"}
                            </span>
                          </div>
                          
                          {service.estimated_hours !== null && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">სავარაუდო დრო:</span>
                              <span>{service.estimated_hours} საათი</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MechanicServices;
