
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Wrench, Calendar, DollarSign, Clock, CheckCircle } from "lucide-react";

const AdminStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_stats');
      if (error) throw error;
      return data[0];
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "მომხმარებლები",
      value: stats?.total_customers || 0,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "მექანიკოსები",
      value: stats?.total_mechanics || 0,
      icon: Wrench,
      color: "text-green-600",
    },
    {
      title: "სერვისები",
      value: stats?.total_services || 0,
      icon: Wrench,
      color: "text-purple-600",
    },
    {
      title: "ჯამური ჯავშნები",
      value: stats?.total_bookings || 0,
      icon: Calendar,
      color: "text-orange-600",
    },
    {
      title: "მოლოდინში",
      value: stats?.pending_bookings || 0,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "დასრულებული",
      value: stats?.completed_bookings || 0,
      icon: CheckCircle,
      color: "text-green-600",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats?.total_revenue && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              ჯამური შემოსავალი
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ₾{Number(stats.total_revenue).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default AdminStats;
