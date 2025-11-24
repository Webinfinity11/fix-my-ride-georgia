
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CheckCircle, Clock, XCircle, Eye } from "lucide-react";

interface BookingStats {
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

const MechanicStats = () => {
  const { user } = useAuth();
  const [bookingStats, setBookingStats] = useState<BookingStats>({
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  });
  const [profileViews, setProfileViews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Fetch booking statistics
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('status')
        .eq('mechanic_id', user.id);

      if (bookingsError) throw bookingsError;

      // Calculate booking stats
      const stats = {
        pending: bookings?.filter(b => b.status === 'pending').length || 0,
        confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
        completed: bookings?.filter(b => b.status === 'completed').length || 0,
        cancelled: bookings?.filter(b => b.status === 'cancelled').length || 0,
      };

      setBookingStats(stats);

      // Fetch profile views
      const { data: views, error: viewsError } = await supabase
        .from('mechanic_profile_views')
        .select('id')
        .eq('mechanic_id', user.id);

      if (viewsError) throw viewsError;

      setProfileViews(views?.length || 0);

    } catch (error: any) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "მოლოდინში",
      value: bookingStats.pending,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "აქტიური",
      value: bookingStats.confirmed,
      icon: Calendar,
      color: "text-blue-600", 
      bgColor: "bg-blue-50"
    },
    {
      title: "დადასტურებული",
      value: bookingStats.completed,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "გაუქმებული",
      value: bookingStats.cancelled,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "გვერდის ნახვები",
      value: profileViews,
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="border border-primary/10 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-2">
                {stat.title}
              </CardTitle>
              <div className={`p-1.5 sm:p-2 rounded-full ${stat.bgColor} flex-shrink-0`}>
                <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-primary">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MechanicStats;
