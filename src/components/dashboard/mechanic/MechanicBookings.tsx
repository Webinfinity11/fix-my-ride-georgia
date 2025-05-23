import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

type BookingType = {
  id: number;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  notes: string | null;
  price: number | null;
  customer: {
    first_name: {
      first_name: string;
    };
    last_name: {
      last_name: string;
    };
    phone: {
      phone: string | null;
    };
  };
  service: {
    name: string;
  };
};

const MechanicBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      console.log("MechanicBookings - current user:", user);
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      console.log("Fetching bookings for mechanic ID:", user.id);
      
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          customer:user_id(
            first_name:profiles(first_name),
            last_name:profiles(last_name),
            phone:profiles(phone)
          ),
          service:service_id(name)
        `)
        .eq("mechanic_id", user.id)
        .order("scheduled_date", { ascending: false });

      if (error) {
        console.error("Error in Supabase query:", error);
        throw error;
      }

      console.log("Fetched bookings:", data);
      
      // Check if data is empty
      if (!data || data.length === 0) {
        console.log("No bookings found for this mechanic");
      }
      
      // Ensure type compatibility - we need to cast the data to match our BookingType
      setBookings(data as unknown as BookingType[]);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
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
        return <Badge variant="secondary" className="bg-green-500 text-white">დასრულებული</Badge>;
      case "cancelled":
        return <Badge variant="destructive">გაუქმებული</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const updateBookingStatus = async (id: number, status: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id)
        .eq("mechanic_id", user?.id);

      if (error) throw error;

      setBookings(
        bookings.map(booking =>
          booking.id === id
            ? { ...booking, status }
            : booking
        )
      );
      
      toast.success("ჯავშნის სტატუსი განახლდა");
    } catch (error: any) {
      toast.error(`ჯავშნის სტატუსის განახლება ვერ მოხერხდა: ${error.message}`);
    }
  };

  const updateBookingPrice = async (id: number, price: number) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ price })
        .eq("id", id)
        .eq("mechanic_id", user?.id);

      if (error) throw error;

      setBookings(
        bookings.map(booking =>
          booking.id === id
            ? { ...booking, price }
            : booking
        )
      );
      
      toast.success("ჯავშნის ფასი განახლდა");
    } catch (error: any) {
      toast.error(`ჯავშნის ფასის განახლება ვერ მოხერხდა: ${error.message}`);
    }
  };

  const getStatusActions = (booking: BookingType) => {
    switch (booking.status) {
      case "pending":
        return (
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => updateBookingStatus(booking.id, "confirmed")}
            >
              დადასტურება
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateBookingStatus(booking.id, "cancelled")}
            >
              უარყოფა
            </Button>
          </div>
        );
      case "confirmed":
        return (
          <Button
            size="sm"
            onClick={() => updateBookingStatus(booking.id, "in_progress")}
          >
            დაწყება
          </Button>
        );
      case "in_progress":
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="ფასი"
                defaultValue={booking.price?.toString() || ""}
                onBlur={(e) => {
                  const price = parseFloat(e.target.value);
                  if (!isNaN(price) && price >= 0) {
                    updateBookingPrice(booking.id, price);
                  }
                }}
                className="w-24"
              />
              <span>GEL</span>
            </div>
            <Button
              size="sm"
              onClick={() => updateBookingStatus(booking.id, "completed")}
            >
              დასრულება
            </Button>
          </div>
        );
      default:
        return null;
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
      <h1 className="text-2xl font-bold mb-6">ჯავშნები</h1>

      {bookings.length === 0 ? (
        <div className="bg-muted p-8 rounded-lg text-center">
          <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">ჯავშნები არ გაქვთ</h3>
          <p className="text-muted-foreground mb-4">
            თქვენ ჯერ არ გაქვთ ჯავშნები
          </p>
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
                  </div>
                  <div>
                    {getStatusActions(booking)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="flex items-start gap-2">
                    <User size={16} className="text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">კლიენტი</p>
                      <p>
                        {booking.customer.first_name.first_name} {booking.customer.last_name.last_name}
                        {booking.customer.phone.phone && (
                          <a 
                            href={`tel:${booking.customer.phone.phone}`} 
                            className="ml-2 text-primary hover:underline"
                          >
                            {booking.customer.phone.phone}
                          </a>
                        )}
                      </p>
                    </div>
                  </div>
                  
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

export default MechanicBookings;
