
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, MapPin, Wrench, Car } from "lucide-react";
import { format } from "date-fns";

type BookingType = {
  id: number;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  notes: string | null;
  price: number | null;
  mechanic: {
    first_name: string;
    last_name: string;
    city: string | null;
    district: string | null;
  };
  service: {
    name: string;
  };
  car: {
    make: string;
    model: string;
    year: number;
  } | null;
};

const CustomerBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          mechanic:mechanic_id(
            first_name:profiles!mechanic_profiles_id_fkey(first_name),
            last_name:profiles!mechanic_profiles_id_fkey(last_name),
            city:profiles!mechanic_profiles_id_fkey(city),
            district:profiles!mechanic_profiles_id_fkey(district)
          ),
          service:service_id(name),
          car:car_id(make, model, year)
        `)
        .eq("user_id", user.id)
        .order("scheduled_date", { ascending: false });

      if (error) throw error;

      setBookings(data || []);
    } catch (error: any) {
      toast.error(`ჯავშნების ჩატვირთვა ვერ მოხერხდა: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">მოლოდინში</Badge>;
      case "confirmed":
        return <Badge variant="default">დადასტურებული</Badge>;
      case "in_progress":
        return <Badge variant="secondary">მიმდინარე</Badge>;
      case "completed":
        return <Badge variant="success">დასრულებული</Badge>;
      case "cancelled":
        return <Badge variant="destructive">გაუქმებული</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const cancelBooking = async (id: number) => {
    if (!confirm("დარწმუნებული ხართ, რომ გსურთ ჯავშნის გაუქმება?")) return;

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", id)
        .eq("user_id", user?.id)
        .in("status", ["pending", "confirmed"]);

      if (error) throw error;

      setBookings(
        bookings.map(booking =>
          booking.id === id
            ? { ...booking, status: "cancelled" }
            : booking
        )
      );
      
      toast.success("ჯავშანი გაუქმდა");
    } catch (error: any) {
      toast.error(`ჯავშნის გაუქმება ვერ მოხერხდა: ${error.message}`);
    }
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
      <h1 className="text-2xl font-bold mb-6">ჩემი ჯავშნები</h1>

      {bookings.length === 0 ? (
        <div className="bg-muted p-8 rounded-lg text-center">
          <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">ჯავშნები არ გაქვთ</h3>
          <p className="text-muted-foreground mb-4">
            თქვენ ჯერ არ გაქვთ ჯავშნები
          </p>
          <Button onClick={() => window.location.href = "/"}>
            მოძებნეთ ხელოსანი
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-6">
                <div className="flex justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium">{booking.service.name}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <p className="text-muted-foreground mt-1">
                      {booking.mechanic.first_name} {booking.mechanic.last_name}
                    </p>
                  </div>
                  <div>
                    {["pending", "confirmed"].includes(booking.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelBooking(booking.id)}
                      >
                        გაუქმება
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="flex items-start gap-2">
                    <Calendar size={16} className="text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">თარიღი</p>
                      <p>
                        {format(new Date(booking.scheduled_date), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Clock size={16} className="text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">დრო</p>
                      <p>{booking.scheduled_time.substring(0, 5)}</p>
                    </div>
                  </div>
                  
                  {booking.car && (
                    <div className="flex items-start gap-2">
                      <Car size={16} className="text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">ავტომობილი</p>
                        <p>
                          {booking.car.make} {booking.car.model} ({booking.car.year})
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">მისამართი</p>
                      <p>
                        {booking.mechanic.city}
                        {booking.mechanic.district
                          ? `, ${booking.mechanic.district}`
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
                
                {booking.notes && (
                  <div className="mt-2">
                    <p className="text-muted-foreground text-sm mb-1">დამატებითი ინფორმაცია:</p>
                    <p className="text-sm bg-muted p-2 rounded">{booking.notes}</p>
                  </div>
                )}
                
                {booking.price && (
                  <div className="mt-4 flex justify-end">
                    <div className="bg-muted px-3 py-1 rounded-full">
                      <span className="text-muted-foreground mr-1">ფასი:</span>
                      <span className="font-medium">{booking.price} GEL</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerBookings;
