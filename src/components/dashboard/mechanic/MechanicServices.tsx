
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, Edit, Trash2, Plus, Tag } from "lucide-react";
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

const MechanicServices = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);

  useEffect(() => {
    fetchServices();
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
            <div className="space-y-4">
              {services.map((service) => (
                <Card key={service.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium">{service.name}</h3>
                          <Badge
                            variant={service.is_active ? "default" : "secondary"}
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
                          variant="outline"
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
        </>
      )}
    </div>
  );
};

export default MechanicServices;
