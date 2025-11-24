import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Phone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ServiceViewCount {
  service: {
    id: number;
    name: string;
    slug: string;
  };
  count: number;
}

const ServicePhoneViewsStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['service-phone-views-stats'],
    queryFn: async () => {
      // ჯამური phone views count
      const { count: totalViews } = await supabase
        .from('service_phone_views')
        .select('*', { count: 'exact', head: true });

      // ყველა phone view-ს მოძებნა service info-ით
      const { data: phoneViews, error } = await supabase
        .from('service_phone_views')
        .select(`
          service_id,
          service:mechanic_services(id, name, slug)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching phone views:', error);
        return { totalViews: 0, topServices: [] };
      }

      // Group by service_id და count
      const serviceViewCounts: Record<number, ServiceViewCount> = {};
      
      phoneViews?.forEach((view: any) => {
        const serviceId = view.service_id;
        if (!serviceViewCounts[serviceId]) {
          serviceViewCounts[serviceId] = {
            service: view.service,
            count: 0
          };
        }
        serviceViewCounts[serviceId].count++;
      });

      // Sort by count და top 10
      const topServicesList = Object.values(serviceViewCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return { totalViews: totalViews || 0, topServices: topServicesList };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ჯამური Phone Views */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            ჯამური ნომრის ნახვები
          </CardTitle>
          <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{stats?.totalViews || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            ყველა სერვისის ნომრის ნახვების რაოდენობა
          </p>
        </CardContent>
      </Card>

      {/* Top 10 Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            ტოპ 10 ყველაზე მეტჯერ ნანახი სერვისი
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-3">
            {stats?.topServices && stats.topServices.length > 0 ? (
              stats.topServices.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary font-bold text-xs sm:text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate">{item.service?.name || 'უცნობი სერვისი'}</p>
                      {item.service?.slug && (
                        <a 
                          href={`/service/${item.service.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          გახსნა →
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-lg sm:text-2xl font-bold text-primary">{item.count}</p>
                    <p className="text-xs text-muted-foreground">ნახვა</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-xs sm:text-sm text-muted-foreground py-6 sm:py-8">
                ჯერ არ არის ნახვები
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServicePhoneViewsStats;
