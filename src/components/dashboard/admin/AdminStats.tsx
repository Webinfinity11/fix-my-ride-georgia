
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
    { title: "მომხმარებლები", value: stats?.total_customers || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "ხელოსნები", value: stats?.total_mechanics || 0, icon: Wrench, color: "text-green-600", bg: "bg-green-50" },
    { title: "სერვისები", value: stats?.total_services || 0, icon: Wrench, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "ჯამური ჯავშნები", value: stats?.total_bookings || 0, icon: Calendar, color: "text-orange-600", bg: "bg-orange-50" },
    { title: "მოლოდინში", value: stats?.pending_bookings || 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "დასრულებული", value: stats?.completed_bookings || 0, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="text-2xl font-bold leading-none">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1 truncate">{stat.title}</div>
              </div>
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
