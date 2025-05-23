
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Bookmark, 
  CheckCircle, 
  XCircle, 
  Play, 
  DollarSign,
  Filter,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  user: {
    id: string;
    email: string;
  };
  customer_profile: {
    first_name: string;
    last_name: string;
    phone: string | null;
  } | null;
  service: {
    name: string;
  };
};

const MechanicBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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
          user:user_id(*),
          customer_profile:user_id(
            id,
            first_name,
            last_name,
            phone
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

  const getFilteredBookings = () => {
    let filtered = bookings;
    
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.customer_profile?.first_name?.toLowerCase().includes(query) ||
        booking.customer_profile?.last_name?.toLowerCase().includes(query) ||
        booking.service.name.toLowerCase().includes(query) ||
        (booking.notes && booking.notes.toLowerCase().includes(query))
      );
    }
    
    if (activeTab === "all") return filtered;
    
    return filtered.filter(booking => {
      switch (activeTab) {
        case "pending": return booking.status === "pending";
        case "active": return ["confirmed", "in_progress"].includes(booking.status);
        case "completed": return booking.status === "completed";
        case "cancelled": return booking.status === "cancelled";
        default: return true;
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">მოლოდინში</Badge>;
      case "confirmed":
        return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">დადასტურებული</Badge>;
      case "in_progress":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">მიმდინარე</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200">დასრულებული</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">გაუქმებული</Badge>;
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
              className="bg-primary hover:bg-primary-dark flex items-center gap-1"
              onClick={() => updateBookingStatus(booking.id, "confirmed")}
            >
              <CheckCircle size={16} />
              <span className="hidden sm:inline">დადასტურება</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive text-destructive hover:bg-destructive/10 flex items-center gap-1"
              onClick={() => updateBookingStatus(booking.id, "cancelled")}
            >
              <XCircle size={16} />
              <span className="hidden sm:inline">უარყოფა</span>
            </Button>
          </div>
        );
      case "confirmed":
        return (
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-1"
            onClick={() => updateBookingStatus(booking.id, "in_progress")}
          >
            <Play size={16} />
            <span className="hidden sm:inline">დაწყება</span>
          </Button>
        );
      case "in_progress":
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <DollarSign size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <Input
                  type="number"
                  placeholder="ფასი"
                  defaultValue={booking.price?.toString() || ""}
                  className="pl-8 w-28"
                  onBlur={(e) => {
                    const price = parseFloat(e.target.value);
                    if (!isNaN(price) && price >= 0) {
                      updateBookingPrice(booking.id, price);
                    }
                  }}
                />
              </div>
              <span>GEL</span>
            </div>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 w-full flex items-center gap-1"
              onClick={() => updateBookingStatus(booking.id, "completed")}
            >
              <CheckCircle size={16} />
              <span>დასრულება</span>
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

  const filteredBookings = getFilteredBookings();
  const bookingCounts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    active: bookings.filter(b => ["confirmed", "in_progress"].includes(b.status)).length,
    completed: bookings.filter(b => b.status === "completed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ჯავშნები</h1>
      
      {/* Search and filter */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="მოძებნე ჯავშანი სახელით, სერვისით..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="all" className="relative">
            ყველა
            <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-slate-100 text-xs font-medium">
              {bookingCounts.all}
            </span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            მოლოდინში
            {bookingCounts.pending > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                {bookingCounts.pending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="relative">
            აქტიური
            {bookingCounts.active > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                {bookingCounts.active}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="relative">
            დასრულებული
            {bookingCounts.completed > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                {bookingCounts.completed}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="relative">
            გაუქმებული
            {bookingCounts.cancelled > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                {bookingCounts.cancelled}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {filteredBookings.length === 0 ? (
            <div className="bg-muted p-8 rounded-lg text-center">
              <Bookmark size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">ჯავშნები არ გაქვთ</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "ძიების შედეგები არ მოიძებნა" 
                  : activeTab === "all" 
                    ? "თქვენ ჯერ არ გაქვთ ჯავშნები" 
                    : `${activeTab} სტატუსის ჯავშნები არ გაქვთ`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden border-l-4 hover:shadow-md transition-shadow" 
                  style={{
                    borderLeftColor: booking.status === 'pending' 
                      ? '#f59e0b' 
                      : booking.status === 'confirmed' 
                        ? '#3b82f6' 
                        : booking.status === 'in_progress' 
                          ? '#8b5cf6' 
                          : booking.status === 'completed' 
                            ? '#10b981' 
                            : '#ef4444'
                  }}
                >
                  <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {booking.service.name}
                          {getStatusBadge(booking.status)}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <User className="text-primary mt-1" size={20} />
                          <div>
                            <p className="text-sm font-medium">კლიენტი</p>
                            {booking.customer_profile ? (
                              <div className="text-sm">
                                <p className="font-medium">
                                  {booking.customer_profile.first_name} {booking.customer_profile.last_name}
                                </p>
                                {booking.customer_profile.phone && (
                                  <a 
                                    href={`tel:${booking.customer_profile.phone}`} 
                                    className="text-primary hover:underline flex items-center mt-1"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {booking.customer_profile.phone}
                                  </a>
                                )}
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-sm">კლიენტის მონაცემები არ არის</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <Calendar className="text-primary mt-1" size={20} />
                          <div>
                            <p className="text-sm font-medium">დრო და თარიღი</p>
                            <p className="text-sm">
                              {format(new Date(booking.scheduled_date), "dd MMMM, yyyy")}
                              <span className="mx-2">•</span>
                              {booking.scheduled_time.substring(0, 5)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {booking.notes && (
                      <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <p className="text-sm font-medium mb-1">დამატებითი ინფორმაცია:</p>
                        <p className="text-sm">{booking.notes}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-end mt-2">
                      <div>
                        {booking.price && (
                          <div className="inline-flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full">
                            <DollarSign size={16} className="mr-1" />
                            <span className="font-medium">{booking.price} GEL</span>
                          </div>
                        )}
                      </div>
                      <div>
                        {getStatusActions(booking)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MechanicBookings;
