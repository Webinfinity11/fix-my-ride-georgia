
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, Edit, Trash2, Plus, Tag, Search, Clock, CreditCard, Banknote, Car, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ServiceForm from "@/components/forms/ServiceForm";
import ServiceStats from "@/components/dashboard/ServiceStats";
import { useIsMobile } from "@/hooks/use-mobile";

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
  accepts_card_payment?: boolean;
  accepts_cash_payment?: boolean;
  working_days?: string[];
  working_hours_start?: string;
  working_hours_end?: string;
  car_brands?: string[];
  on_site_service?: boolean;
  address?: string;
  latitude?: number;
  longitude?: number;
};

type ServiceCategoryType = {
  id: number;
  name: string;
  description: string | null;
};

const weekDaysMap: Record<string, string> = {
  "monday": "ორშაბათი",
  "tuesday": "სამშაბათი",
  "wednesday": "ოთხშაბათი",
  "thursday": "ხუთშაბათი",
  "friday": "პარასკევი",
  "saturday": "შაბათი",
  "sunday": "კვირა"
};

const MechanicServices = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [categories, setCategories] = useState<ServiceCategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [totalBookings, setTotalBookings] = useState(0);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    fetchServices();
    fetchCategories();
    fetchStats();
  }, [user]);

  // Show form by default if no services exist (for new mechanics)
  useEffect(() => {
    if (!loading && services.length === 0 && !showForm) {
      console.log('🎯 No services found, showing add service form by default');
      setShowForm(true);
    }
  }, [loading, services.length, showForm]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Fetch total bookings
      const { count: bookingsCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("mechanic_id", user.id);

      setTotalBookings(bookingsCount || 0);

      // Calculate average rating from mechanic profile
      const { data: profileData } = await supabase
        .from("mechanic_profiles")
        .select("rating")
        .eq("id", user.id)
        .single();

      setAvgRating(profileData?.rating || 0);
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    }
  };

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
    
    const matchesCategory = filterCategory === "all" || 
      (service.category_id !== null && service.category_id.toString() === filterCategory);
    
    return matchesSearch && matchesCategory;
  });

  const activeServicesCount = services.filter(s => s.is_active).length;
  const inactiveServicesCount = services.filter(s => !s.is_active).length;

  const formatWorkingDays = (days?: string[]) => {
    if (!days || days.length === 0) return "არ არის მითითებული";
    
    if (days.length === 7) return "ყოველდღე";
    
    return days.map(day => weekDaysMap[day] || day).join(", ");
  };

  const formatWorkingHours = (start?: string, end?: string) => {
    if (!start || !end) return "არ არის მითითებული";
    return `${start} - ${end}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-0 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-primary">ჩემი სერვისები</h1>
        <Button 
          onClick={() => { setEditingService(null); setShowForm(true); }} 
          className="bg-primary hover:bg-primary-light transition-colors w-full sm:w-auto"
          size={isMobile ? "sm" : "default"}
        >
          <Plus size={16} className="mr-2" />
          დამატება
        </Button>
      </div>

      {/* Service Statistics - Hidden on mobile */}
      {!isMobile && (
        <ServiceStats
          totalServices={services.length}
          activeServices={activeServicesCount}
          totalBookings={totalBookings}
          avgRating={avgRating}
        />
      )}

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
            <div className="bg-muted/50 p-4 sm:p-8 rounded-lg text-center border border-primary/10 shadow-sm">
              <Wrench size={isMobile ? 32 : 48} className="mx-auto text-primary/60 mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2">სერვისები არ არის</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                თქვენ ჯერ არ გაქვთ დამატებული სერვისები
              </p>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-primary hover:bg-primary-light transition-colors w-full sm:w-auto"
                size={isMobile ? "sm" : "default"}
              >
                დაამატეთ პირველი სერვისი
              </Button>
            </div>
          ) : (
            <div className="w-full max-w-full">
              <div className="flex flex-col gap-3 mb-6 w-full">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="სერვისის ძიება..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 border-primary/20 focus-visible:ring-primary w-full"
                    size={isMobile ? "sm" : "default"}
                  />
                </div>
                
                <div className="w-full">
                  <Select 
                    value={filterCategory}
                    onValueChange={(value: string) => setFilterCategory(value)}
                  >
                    <SelectTrigger className="border-primary/20 focus-visible:ring-primary w-full">
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
              </div>

              <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="relative border-primary/20 hover:bg-primary/5 flex-shrink-0 min-w-fit"
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
                  className="relative border-primary/20 hover:bg-primary/5 flex-shrink-0 min-w-fit"
                >
                  აქტიური
                  <Badge variant="secondary" className="ml-1 bg-green-100 text-green-800">
                    {activeServicesCount}
                  </Badge>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="relative border-primary/20 hover:bg-primary/5 flex-shrink-0 min-w-fit"
                >
                  არააქტიური
                  <Badge variant="secondary" className="ml-1">
                    {inactiveServicesCount}
                  </Badge>
                </Button>
              </div>

              {filteredServices.length === 0 ? (
                <div className="text-center p-4 sm:p-8 bg-muted/50 rounded-lg border border-primary/10">
                  <p className="text-muted-foreground text-sm sm:text-base">სერვისები ვერ მოიძებნა</p>
                </div>
              ) : (
                <div className="space-y-4 w-full">
                  {filteredServices.map((service) => (
                    <Card key={service.id} className={`border-l-4 ${service.is_active ? 'border-l-green-500' : 'border-l-gray-300'} hover:shadow-md transition-shadow duration-200 w-full max-w-full`}>
                      <CardContent className="p-4 sm:p-6 w-full">
                        <div className="flex flex-col gap-4 mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-2">
                              <h3 className="text-base sm:text-lg font-medium break-words word-wrap">{service.name}</h3>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant={service.is_active ? "secondary" : "outline"}
                                  className={`${service.is_active ? "bg-green-100 text-green-800" : ""} flex-shrink-0`}
                                >
                                  {service.is_active ? "აქტიური" : "არააქტიური"}
                                </Badge>
                                {service.category_name && (
                                  <div className="flex items-center text-muted-foreground text-sm min-w-0">
                                    <Tag size={14} className="mr-1 text-primary/70 flex-shrink-0" />
                                    <span className="break-words word-wrap truncate">{service.category_name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 w-full">
                            <Button
                              variant={service.is_active ? "outline" : "default"}
                              size="sm"
                              className={`${service.is_active ? "border-primary/20 hover:bg-primary/5" : "bg-primary hover:bg-primary-light"} w-full`}
                              onClick={() => handleToggleActive(service.id, service.is_active)}
                            >
                              {service.is_active ? "გამორთვა" : "ჩართვა"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-primary/20 hover:bg-primary/5 text-primary w-full"
                              onClick={() => handleEdit(service)}
                            >
                              <Edit size={16} className="mr-2" />
                              რედაქტირება
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full"
                              onClick={() => handleDelete(service.id)}
                            >
                              <Trash2 size={16} className="mr-2" />
                              წაშლა
                            </Button>
                          </div>
                        </div>
                        
                        {service.description && (
                          <p className="mb-4 text-sm text-muted-foreground break-words word-wrap">
                            {service.description}
                          </p>
                        )}
                        
                        {service.address && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                              <MapPin size={14} className="flex-shrink-0" />
                              <span>მისამართი:</span>
                            </div>
                            <span className="text-sm break-words word-wrap">{service.address}</span>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 gap-4 mt-4">
                          <div className="flex flex-col space-y-1">
                            <span className="text-xs text-muted-foreground">ფასი:</span>
                            <span className="font-medium text-sm break-words word-wrap">
                              {service.price_from
                                ? service.price_to
                                  ? `${service.price_from} - ${service.price_to} GEL`
                                  : `${service.price_from} GEL`
                                : "ფასი განისაზღვრება ინდივიდუალურად"}
                            </span>
                          </div>
                          
                          {service.estimated_hours !== null && (
                            <div className="flex flex-col space-y-1">
                              <span className="text-xs text-muted-foreground">სავარაუდო დრო:</span>
                              <span className="font-medium text-sm">{service.estimated_hours} საათი</span>
                            </div>
                          )}
                          
                          <div className="flex flex-col space-y-1">
                            <span className="text-xs text-muted-foreground">გადახდის მეთოდები:</span>
                            <div className="flex items-center gap-2 flex-wrap">
                              {service.accepts_cash_payment !== false && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Banknote size={14} className="text-green-600 flex-shrink-0" />
                                  <span>ნაღდი</span>
                                </div>
                              )}
                              {service.accepts_card_payment && (
                                <div className="flex items-center gap-1 text-sm">
                                  <CreditCard size={14} className="text-blue-600 flex-shrink-0" />
                                  <span>ბარათი</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4 mt-4 pt-4 border-t border-dashed border-gray-200">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock size={14} className="flex-shrink-0" />
                              <span>სამუშაო დღეები:</span>
                            </div>
                            <span className="text-sm break-words word-wrap">{formatWorkingDays(service.working_days)}</span>
                          </div>
                          
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock size={14} className="flex-shrink-0" />
                              <span>სამუშაო საათები:</span>
                            </div>
                            <span className="text-sm">{formatWorkingHours(service.working_hours_start, service.working_hours_end)}</span>
                          </div>
                        </div>
                        
                        {service.car_brands && service.car_brands.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                              <Car size={14} className="flex-shrink-0" />
                              <span>მანქანის მარკები:</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {service.car_brands.map(brand => (
                                <Badge key={brand} variant="outline" className="bg-muted/50 text-xs">
                                  {brand}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {service.on_site_service && (
                          <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                              შესაძლებელია ადგილზე მისვლა
                            </Badge>
                          </div>
                        )}
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
