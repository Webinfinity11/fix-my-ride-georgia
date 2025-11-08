import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createServiceSlug } from "@/utils/slugUtils";
import { Plus, Edit, Trash2, Eye, Star, MapPin, Clock, CreditCard, Banknote, ChevronDown, Filter, Crown, Zap, AlertCircle, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useServiceVIPRequest, useCreateVIPRequest, VIPPlanType } from "@/hooks/useVIPRequests";
import { VIPBadge } from "@/components/services/VIPBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import EditServiceDialog from "./EditServiceDialog";

interface Service {
  id: number;
  name: string;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  estimated_hours: number | null;
  city: string | null;
  district: string | null;
  car_brands: string[] | null;
  on_site_service: boolean;
  accepts_card_payment: boolean;
  accepts_cash_payment: boolean;
  is_active: boolean;
  rating: number | null;
  review_count: number | null;
  vip_status: VIPPlanType | null;
  vip_until: string | null;
  is_vip_active: boolean | null;
  category: {
    id: number;
    name: string;
  } | null;
}

interface Category {
  id: number;
  name: string;
}

const MechanicServices = () => {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [vipDialogOpen, setVipDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<VIPPlanType | null>(null);
  const [vipMessage, setVipMessage] = useState("");

  const fetchServices = async () => {
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('mechanic_services')
      .select(`
        id,
        name,
        description,
        price_from,
        price_to,
        estimated_hours,
        city,
        district,
        car_brands,
        on_site_service,
        accepts_card_payment,
        accepts_cash_payment,
        is_active,
        rating,
        review_count,
        vip_status,
        vip_until,
        is_vip_active,
        service_categories (
          id,
          name
        )
      `)
      .eq('mechanic_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform the data to match our Service interface
    return (data || []).map((service: any) => ({
      ...service,
      category: Array.isArray(service.service_categories) 
        ? service.service_categories[0] 
        : service.service_categories
    })) as Service[];
  };

  const { data: services = [], isLoading, refetch } = useQuery({
    queryKey: ['mechanic-services'],
    queryFn: fetchServices,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data as Category[];
    },
  });

  const handleDeleteService = async (serviceId: number) => {
    if (!confirm('დარწმუნებული ხართ, რომ გსურთ ამ სერვისის წაშლა?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('mechanic_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      toast.success('სერვისი წარმატებით წაიშალა');
      refetch();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error('სერვისის წაშლისას შეცდომა დაფიქსირდა');
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setIsEditDialogOpen(true);
  };

  const handleServiceUpdated = () => {
    refetch();
  };

  const createRequest = useCreateVIPRequest();

  const handleOpenVipDialog = (service: Service, plan: VIPPlanType) => {
    setSelectedService(service);
    setSelectedPlan(plan);
    setVipMessage("");
    setVipDialogOpen(true);
  };

  const handleSubmitVipRequest = async () => {
    if (!selectedService || !selectedPlan) return;

    try {
      await createRequest.mutateAsync({
        serviceId: selectedService.id,
        plan: selectedPlan,
        message: vipMessage || undefined,
      });

      toast.success("VIP მოთხოვნა წარმატებით გაიგზავნა!");
      setVipDialogOpen(false);
      setSelectedService(null);
      setSelectedPlan(null);
      setVipMessage("");
      refetch();
    } catch (error: any) {
      console.error("VIP request error:", error);
      toast.error(error.message || "მოთხოვნის გაგზავნა ვერ მოხერხდა");
    }
  };

  const formatVIPExpiration = (vipUntil: string | null) => {
    if (!vipUntil) return null;
    
    const expirationDate = new Date(vipUntil);
    const now = new Date();
    const daysLeft = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      date: expirationDate.toLocaleDateString('ka-GE'),
      daysLeft: daysLeft > 0 ? daysLeft : 0,
    };
  };

  const filteredServices = services.filter(service => {
    const categoryMatch = filterCategory === "all" || service.category?.id.toString() === filterCategory;
    const statusMatch = filterStatus === "all" || 
      (filterStatus === "active" && service.is_active) ||
      (filterStatus === "inactive" && !service.is_active);
    
    return categoryMatch && statusMatch;
  });

  const formatPrice = (priceFrom: number | null, priceTo: number | null) => {
    if (!priceFrom && !priceTo) return "ფასი შეთანხმებით";
    if (priceFrom && priceTo && priceFrom !== priceTo) return `₾${priceFrom} - ₾${priceTo}`;
    if (priceFrom) return `₾${priceFrom}`;
    if (priceTo) return `₾${priceTo}`;
    return "ფასი შეთანხმებით";
  };

  const getSelectedCategoryName = () => {
    if (filterCategory === "all") return "ყველა კატეგორია";
    const category = categories.find(cat => cat.id.toString() === filterCategory);
    return category ? category.name : "ყველა კატეგორია";
  };

  const hasActiveFilters = filterCategory !== "all" || filterStatus !== "all";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">ჩემი სერვისები</h2>
        <Link to="/add-service">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            ახალი სერვისის დამატება
          </Button>
        </Link>
      </div>

      {/* Compact Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            ფილტრები
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 text-xs">
                აქტიური
              </Badge>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterCategory("all");
                setFilterStatus("all");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              გასუფთავება
            </Button>
          )}
        </div>

        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">კატეგორია</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {getSelectedCategoryName()}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto bg-background border shadow-lg">
                    <DropdownMenuItem
                      onClick={() => setFilterCategory("all")}
                      className={filterCategory === "all" ? "bg-accent" : ""}
                    >
                      ყველა კატეგორია
                    </DropdownMenuItem>
                    {categories.map(category => (
                      <DropdownMenuItem
                        key={category.id}
                        onClick={() => setFilterCategory(category.id.toString())}
                        className={filterCategory === category.id.toString() ? "bg-accent" : ""}
                      >
                        {category.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">სტატუსი</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {filterStatus === "all" ? "ყველა სტატუსი" : 
                       filterStatus === "active" ? "აქტიური" : "არააქტიური"}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-background border shadow-lg">
                    <DropdownMenuItem
                      onClick={() => setFilterStatus("all")}
                      className={filterStatus === "all" ? "bg-accent" : ""}
                    >
                      ყველა სტატუსი
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFilterStatus("active")}
                      className={filterStatus === "active" ? "bg-accent" : ""}
                    >
                      აქტიური
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFilterStatus("inactive")}
                      className={filterStatus === "inactive" ? "bg-accent" : ""}
                    >
                      არააქტიური
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {filteredServices.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters 
                ? "მოცემული ფილტრებით სერვისები ვერ მოიძებნა"
                : "თქვენ ჯერ არ გაქვთ დამატებული სერვისები"
              }
            </p>
            <Link to="/add-service">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                ახალი სერვისის დამატება
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map(service => (
            <Card key={service.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      {service.name}
                    </h3>
                    {service.category && (
                      <Badge variant="outline" className="text-xs mb-2">
                        {service.category.name}
                      </Badge>
                    )}
                  </div>
                  <Badge 
                    variant={service.is_active ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {service.is_active ? "აქტიური" : "არააქტიური"}
                  </Badge>
                </div>

                {service.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {service.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>ფასი:</span>
                    <span className="font-medium">{formatPrice(service.price_from, service.price_to)}</span>
                  </div>
                  
                  {service.estimated_hours && (
                    <div className="flex items-center justify-between text-sm">
                      <span>დრო:</span>
                      <span>{service.estimated_hours} საათი</span>
                    </div>
                  )}

                  {(service.city || service.district) && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{service.city}{service.district ? `, ${service.district}` : ''}</span>
                    </div>
                  )}

                  {service.rating && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{service.rating}</span>
                      <span className="text-muted-foreground">({service.review_count || 0})</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {service.accepts_cash_payment && (
                    <Badge variant="outline" className="text-xs">
                      <Banknote className="w-3 h-3 mr-1" />
                      ნაღდი
                    </Badge>
                  )}
                  {service.accepts_card_payment && (
                    <Badge variant="outline" className="text-xs">
                      <CreditCard className="w-3 h-3 mr-1" />
                      ბარათი
                    </Badge>
                  )}
                  {service.on_site_service && (
                    <Badge variant="outline" className="text-xs">
                      ადგილზე მისვლა
                    </Badge>
                  )}
                </div>

                {service.car_brands && service.car_brands.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-1">მანქანის მარკები:</p>
                    <div className="flex flex-wrap gap-1">
                      {service.car_brands.slice(0, 3).map((brand, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {brand}
                        </Badge>
                      ))}
                      {service.car_brands.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{service.car_brands.length - 3} სხვა
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* VIP Section */}
                <VIPRequestSection 
                  service={service}
                  onRequestVIP={handleOpenVipDialog}
                  formatVIPExpiration={formatVIPExpiration}
                />

                <div className="flex gap-2">
                  <Link to={`/service/${createServiceSlug(service.id, service.name)}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-1" />
                      ნახვა
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditService(service)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteService(service.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EditServiceDialog
        service={editingService}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onServiceUpdated={handleServiceUpdated}
      />

      {/* VIP Request Dialog */}
      <Dialog open={vipDialogOpen} onOpenChange={setVipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>VIP მოთხოვნის გაგზავნა</DialogTitle>
            <DialogDescription>
              სერვისი: {selectedService?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={selectedPlan === "vip" ? "default" : "outline"}
                onClick={() => setSelectedPlan("vip")}
                className="h-auto flex flex-col items-center gap-2 py-4"
              >
                <Crown className="w-6 h-6" />
                <div>
                  <div className="font-semibold">VIP</div>
                  <div className="text-xs text-muted-foreground">პრიორიტეტული ჩვენება</div>
                </div>
              </Button>

              <Button
                variant={selectedPlan === "super_vip" ? "default" : "outline"}
                onClick={() => setSelectedPlan("super_vip")}
                className="h-auto flex flex-col items-center gap-2 py-4"
              >
                <Zap className="w-6 h-6" />
                <div>
                  <div className="font-semibold">Super VIP</div>
                  <div className="text-xs text-muted-foreground">მაქსიმალური ხილვადობა</div>
                </div>
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">შეტყობინება (არასავალდებულო)</label>
              <Textarea
                value={vipMessage}
                onChange={(e) => setVipMessage(e.target.value)}
                placeholder="დაწერეთ დამატებითი ინფორმაცია..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {vipMessage.length}/500 სიმბოლო
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVipDialogOpen(false)}>
              გაუქმება
            </Button>
            <Button 
              onClick={handleSubmitVipRequest}
              disabled={!selectedPlan || createRequest.isPending}
            >
              {createRequest.isPending ? "იგზავნება..." : "გაგზავნა"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// VIP Request Section Component
const VIPRequestSection = ({ 
  service, 
  onRequestVIP, 
  formatVIPExpiration 
}: { 
  service: Service; 
  onRequestVIP: (service: Service, plan: VIPPlanType) => void;
  formatVIPExpiration: (vipUntil: string | null) => { date: string; daysLeft: number } | null;
}) => {
  const { data: existingRequest, isLoading } = useServiceVIPRequest(service.id);

  if (isLoading) {
    return (
      <div className="mb-4 p-3 bg-muted/30 rounded-lg animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4"></div>
      </div>
    );
  }

  // Case 1: Active VIP
  if (service.is_vip_active && service.vip_status) {
    const expiration = formatVIPExpiration(service.vip_until);
    return (
      <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <VIPBadge vipStatus={service.vip_status} size="sm" />
            {expiration && (
              <span className="text-xs text-muted-foreground">
                {expiration.daysLeft > 0 ? `${expiration.daysLeft} დღე დარჩა` : "ამოიწურა"}
              </span>
            )}
          </div>
          {expiration && (
            <span className="text-xs text-muted-foreground">
              ვადა: {expiration.date}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Case 2: Pending Request
  if (existingRequest && existingRequest.status === 'pending') {
    return (
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              VIP მოთხოვნა მოლოდინში
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              გეგმა: {existingRequest.requested_plan === 'vip' ? 'VIP' : 'Super VIP'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Need More Info
  if (existingRequest && existingRequest.status === 'need_info') {
    return (
      <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              საჭიროა დამატებითი ინფორმაცია
            </p>
            {existingRequest.admin_message && (
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                ადმინი: {existingRequest.admin_message}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Case 4: Rejected
  if (existingRequest && existingRequest.status === 'rejected') {
    return (
      <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              VIP მოთხოვნა უარყოფილია
            </p>
            {existingRequest.rejection_reason && (
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                მიზეზი: {existingRequest.rejection_reason}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Case 5: No VIP - Show Request Buttons
  return (
    <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border">
      <p className="text-sm font-medium mb-2">VIP სტატუსი</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRequestVIP(service, 'vip')}
          className="flex-1"
        >
          <Crown className="w-4 h-4 mr-1" />
          VIP
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRequestVIP(service, 'super_vip')}
          className="flex-1"
        >
          <Zap className="w-4 h-4 mr-1" />
          Super VIP
        </Button>
      </div>
    </div>
  );
};

export default MechanicServices;
