import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Eye, Star, MapPin, Clock, CreditCard, Banknote } from "lucide-react";
import { Link } from "react-router-dom";

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

  const fetchServices = async () => {
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
        service_categories (
          id,
          name
        )
      `)
      .eq('mechanic_id', supabase.auth.user()?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Service[];
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

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCategory("all")}
          >
            ყველა კატეგორია
          </Button>
          {categories.map(category => (
            <Button
              key={category.id}
              variant={filterCategory === category.id.toString() ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterCategory(category.id.toString())}
            >
              {category.name}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            ყველა სტატუსი
          </Button>
          <Button
            variant={filterStatus === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("active")}
          >
            აქტიური
          </Button>
          <Button
            variant={filterStatus === "inactive" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("inactive")}
          >
            არააქტიური
          </Button>
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {filterCategory !== "all" || filterStatus !== "all" 
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

                <div className="flex gap-2">
                  <Link to={`/service/${service.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-1" />
                      ნახვა
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm">
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
    </div>
  );
};

export default MechanicServices;
