
import { useAuth } from "@/context/AuthContext";
import { QuickActionsGrid } from "@/components/mobile/QuickActionsGrid";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, Calendar, Car, MessageCircle, Star, MapPin, Wrench, Fuel } from "lucide-react";

const CustomerDashboard = () => {
  const { user } = useAuth();

  const quickActions = [
    { icon: Search, label: 'სერვისის ძიება', href: '/services', color: 'bg-primary/10' },
    { icon: Calendar, label: 'ჯავშანი', href: '/dashboard/bookings', color: 'bg-green-500/10' },
    { icon: Car, label: 'ჩემი მანქანები', href: '/dashboard/cars', color: 'bg-blue-500/10' },
    { icon: MessageCircle, label: 'ჩატი', href: '/chat', color: 'bg-purple-500/10' },
    { icon: Star, label: 'შენახული', href: '/dashboard/saved-services', color: 'bg-yellow-500/10' },
    { icon: MapPin, label: 'რუკა', href: '/map', color: 'bg-red-500/10' },
    { icon: Wrench, label: 'ხელოსნები', href: '/mechanic', color: 'bg-orange-500/10' },
    { icon: Fuel, label: 'საწვავი', href: '/fuel-importers', color: 'bg-indigo-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">მთავარი გვერდი</h1>
        <p className="text-muted-foreground">
          გამარჯობა, {user?.firstName}! კეთილი იყოს თქვენი მობრძანება
        </p>
      </div>

      {/* Quick Actions - Mobile Optimized */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">სწრაფი მოქმედებები</CardTitle>
          <CardDescription>აირჩიეთ სასურველი სერვისი</CardDescription>
        </CardHeader>
        <CardContent>
          <QuickActionsGrid actions={quickActions} />
        </CardContent>
      </Card>

      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle>თქვენი კაბინეტი</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            აქედან შეგიძლიათ მართოთ თქვენი პროფილი, ავტომობილები და ჯავშნები.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Car className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">მანქანები</p>
              <p className="text-xs text-muted-foreground">მართეთ თქვენი ავტოპარკი</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">ჯავშნები</p>
              <p className="text-xs text-muted-foreground">ნახეთ თქვენი ჯავშნები</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDashboard;
