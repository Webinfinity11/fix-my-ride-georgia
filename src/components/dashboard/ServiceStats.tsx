
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Eye, 
  Calendar, 
  Star,
  Wrench,
  Users,
  Clock,
  MapPin
} from "lucide-react";

interface ServiceStatsProps {
  totalServices: number;
  activeServices: number;
  totalBookings: number;
  avgRating: number;
  totalViews?: number;
  completedBookings?: number;
}

const ServiceStats = ({ 
  totalServices, 
  activeServices, 
  totalBookings, 
  avgRating,
  totalViews = 0,
  completedBookings = 0
}: ServiceStatsProps) => {
  const inactiveServices = totalServices - activeServices;
  const activePercentage = totalServices > 0 ? (activeServices / totalServices) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ჯამური სერვისები</CardTitle>
          <Wrench className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalServices}</div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {activeServices} აქტიური
            </Badge>
            {inactiveServices > 0 && (
              <Badge variant="outline">
                {inactiveServices} არააქტიური
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {activePercentage.toFixed(0)}% აქტიურია
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ჯამური ბრონირება</CardTitle>
          <Calendar className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalBookings}</div>
          {completedBookings > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {completedBookings} დასრულებული
              </Badge>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            ყველა დროის ბრონირება
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">საშუალო რეიტინგი</CardTitle>
          <Star className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {avgRating > 0 ? avgRating.toFixed(1) : "—"}
          </div>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3 w-3 ${
                  star <= avgRating
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            მომხმარებელთა შეფასება
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ნახვები</CardTitle>
          <Eye className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalViews}</div>
          <div className="flex items-center text-xs text-muted-foreground mt-2">
            <TrendingUp className="h-3 w-3 mr-1" />
            პროფილის ნახვები
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceStats;
