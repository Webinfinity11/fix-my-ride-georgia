import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Check, 
  ChevronRight,
  Clock, 
  MapPin, 
  Car, 
  Wrench,
  Calendar as CalendarComponent
} from "lucide-react";
import { format, addDays, isToday, isBefore, startOfToday } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import BookingSteps from "@/components/booking/BookingSteps";
import BookingSuccess from "@/components/booking/BookingSuccess";

// Define step type
type BookingStep = "service" | "datetime" | "car" | "confirmation" | "success";

// Define mechanic type
type MechanicType = {
  id: string;
  profile: {
    first_name: string;
    last_name: string;
    city: string;
    district: string;
  };
  mechanic_profile: {
    specialization: string | null;
    is_mobile: boolean;
  };
};

// Define service type
type ServiceType = {
  id: number;
  name: string;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  estimated_hours: number | null;
  service_categories?: {
    name: string;
  } | null;
};

// Define car type
type CarType = {
  id: number;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  engine?: string | null;
  transmission?: string | null;
};

// Define booking data type
type BookingData = {
  service_id: number | null;
  service_name: string;
  scheduled_date: Date | null;
  scheduled_time: string | null;
  car_id: number | null;
  car_name: string;
  notes: string;
};

const BookPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<BookingStep>("service");
  const [mechanic, setMechanic] = useState<MechanicType | null>(null);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [cars, setCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<BookingData>({
    service_id: null,
    service_name: "",
    scheduled_date: null,
    scheduled_time: null,
    car_id: null,
    car_name: "",
    notes: "",
  });
  const [availableTimes] = useState<string[]>([
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
    "15:00", "16:00", "17:00", "18:00"
  ]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      toast.error("გთხოვთ გაიაროთ ავტორიზაცია");
      navigate("/login");
    }
  }, [user, navigate]);
  
  // Fetch mechanic, services and cars data
  useEffect(() => {
    if (!id || !user) return;
    
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch mechanic
        const { data: mechanicData, error: mechanicError } = await supabase
          .from("profiles")
          .select(`
            id,
            first_name,
            last_name,
            city,
            district,
            mechanic_profiles!inner(specialization, is_mobile)
          `)
          .eq("id", id)
          .eq("role", "mechanic")
          .single();
        
        if (mechanicError) throw mechanicError;
        
        // Structure mechanic data
        const formattedMechanic: MechanicType = {
          id: mechanicData.id,
          profile: {
            first_name: mechanicData.first_name,
            last_name: mechanicData.last_name,
            city: mechanicData.city,
            district: mechanicData.district,
          },
          mechanic_profile: mechanicData.mechanic_profiles,
        };
        
        setMechanic(formattedMechanic);
        
        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from("mechanic_services")
          .select(`
            *,
            service_categories(name)
          `)
          .eq("mechanic_id", id)
          .eq("is_active", true);
        
        if (servicesError) throw servicesError;
        setServices(servicesData || []);
        
        // Fetch user's cars
        const { data: carsData, error: carsError } = await supabase
          .from("cars")
          .select("*")
          .eq("user_id", user.id);
        
        if (carsError) throw carsError;
        setCars(carsData || []);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error("მონაცემების ჩატვირთვისას შეცდომა დაფიქსირდა");
        navigate("/search");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, user, navigate]);
  
  // Handle selecting service
  const handleSelectService = (service: ServiceType) => {
    setBookingData({
      ...bookingData,
      service_id: service.id,
      service_name: service.name,
    });
    setCurrentStep("datetime");
  };
  
  // Handle selecting date
  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      setBookingData({
        ...bookingData,
        scheduled_date: date,
      });
    }
  };
  
  // Handle selecting time
  const handleSelectTime = (time: string) => {
    setBookingData({
      ...bookingData,
      scheduled_time: time,
    });
    setCurrentStep("car");
  };
  
  // Handle selecting car
  const handleSelectCar = (car: CarType) => {
    setBookingData({
      ...bookingData,
      car_id: car.id,
      car_name: `${car.make} ${car.model} (${car.year})`,
    });
    setCurrentStep("confirmation");
  };
  
  // Handle notes change
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBookingData({
      ...bookingData,
      notes: e.target.value,
    });
  };
  
  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    if (!user || !mechanic || !bookingData.service_id || 
        !bookingData.scheduled_date || !bookingData.scheduled_time) {
      toast.error("გთხოვთ შეავსოთ ყველა აუცილებელი ველი");
      return;
    }
    
    try {
      // Format date for database
      const formattedDate = format(bookingData.scheduled_date, "yyyy-MM-dd");
      
      // Create booking in database
      const { error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          mechanic_id: mechanic.id,
          service_id: bookingData.service_id,
          car_id: bookingData.car_id,
          scheduled_date: formattedDate,
          scheduled_time: bookingData.scheduled_time,
          notes: bookingData.notes || null,
          status: "pending"
        });
        
      if (error) throw error;
      
      // Show success message and navigate to success step
      toast.success("ჯავშანი წარმატებით გაკეთდა");
      setCurrentStep("success");
      
    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast.error("ჯავშნის შექმნისას შეცდომა დაფიქსირდა");
    }
  };
  
  // Check if date is available (disable past dates)
  const isDateUnavailable = (date: Date) => {
    return isBefore(date, startOfToday()) && !isToday(date);
  };
  
  // Navigate back based on current step
  const handleBack = () => {
    switch(currentStep) {
      case "datetime":
        setCurrentStep("service");
        break;
      case "car":
        setCurrentStep("datetime");
        break;
      case "confirmation":
        setCurrentStep("car");
        break;
      default:
        navigate(-1);
    }
  };
  
  // Generate initials for avatar
  const initials = mechanic
    ? `${mechanic.profile.first_name.charAt(0)}${mechanic.profile.last_name.charAt(0)}`
    : "";
    
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-muted py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                <div className="flex items-center gap-4 mb-6">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                
                <div className="space-y-4 mt-8">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!mechanic) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-muted flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <h1 className="text-2xl font-bold mb-4">ხელოსანი ვერ მოიძებნა</h1>
            <p className="mb-6">მოთხოვნილი ხელოსანი არ არსებობს ან წაშლილია.</p>
            <Button onClick={() => navigate("/search")}>
              დაბრუნება ძიებაზე
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-muted py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Booking steps indicator */}
            <BookingSteps currentStep={currentStep} />
            
            {/* Booking content */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Header with mechanic info */}
              <div className="p-6 border-b">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h2 className="text-lg font-semibold">
                      {mechanic.profile.first_name} {mechanic.profile.last_name}
                    </h2>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      <span>
                        {mechanic.profile.city}
                        {mechanic.profile.district ? `, ${mechanic.profile.district}` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Step content */}
              {currentStep === "service" && (
                <div className="p-6">
                  <h3 className="text-lg font-medium mb-4">აირჩიეთ სერვისი</h3>
                  
                  {services.length > 0 ? (
                    <div className="space-y-4">
                      {services.map((service) => (
                        <div 
                          key={service.id}
                          className="border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer"
                          onClick={() => handleSelectService(service)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{service.name}</h4>
                              {service.service_categories && (
                                <p className="text-sm text-muted-foreground">
                                  {service.service_categories.name}
                                </p>
                              )}
                              {service.description && (
                                <p className="text-sm mt-1">
                                  {service.description}
                                </p>
                              )}
                              {service.estimated_hours && (
                                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                  <span>დაახლოებით {service.estimated_hours} საათი</span>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {service.price_from && service.price_to
                                  ? `${service.price_from} - ${service.price_to} ₾`
                                  : service.price_from
                                    ? `${service.price_from} ₾`
                                    : "ფასი შეთანხმებით"}
                              </p>
                              <ChevronRight className="h-4 w-4 ml-auto mt-2 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        ამ ხელოსანს სერვისები არ აქვს დამატებული
                      </p>
                      <Button onClick={() => navigate(-1)} variant="outline" className="mt-4">
                        უკან დაბრუნება
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {currentStep === "datetime" && (
                <div className="p-6">
                  <h3 className="text-lg font-medium mb-4">აირჩიეთ თარიღი და დრო</h3>
                  
                  <div className="space-y-6">
                    {/* Date selector */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">თარიღი:</p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !bookingData.scheduled_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {bookingData.scheduled_date ? (
                              format(bookingData.scheduled_date, "PPP")
                            ) : (
                              <span>აირჩიეთ თარიღი</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={bookingData.scheduled_date || undefined}
                            onSelect={handleSelectDate}
                            disabled={isDateUnavailable}
                            initialFocus
                            fromDate={new Date()}
                            toDate={addDays(new Date(), 30)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {/* Time slots */}
                    {bookingData.scheduled_date && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">დრო:</p>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {availableTimes.map((time) => (
                            <Button
                              key={time}
                              variant={bookingData.scheduled_time === time ? "default" : "outline"}
                              className="py-2"
                              onClick={() => handleSelectTime(time)}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {currentStep === "car" && (
                <div className="p-6">
                  <h3 className="text-lg font-medium mb-4">აირჩიეთ ავტომობილი</h3>
                  
                  {cars.length > 0 ? (
                    <div className="space-y-4">
                      {cars.map((car) => (
                        <div 
                          key={car.id}
                          className="border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer"
                          onClick={() => handleSelectCar(car)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Car className="h-8 w-8 text-muted-foreground mr-3" />
                              <div>
                                <h4 className="font-medium">{car.make} {car.model}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {car.year} წ.{car.vin && ` | VIN: ${car.vin}`}
                                  {car.engine && ` | ძრავი: ${car.engine}`}
                                  {car.transmission && ` | ${car.transmission}`}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                      
                      <Button 
                        variant="outline" 
                        className="w-full flex items-center justify-center gap-2 mt-2"
                        onClick={() => navigate("/dashboard/cars/new", { state: { returnTo: `/book/${id}` } })}
                      >
                        <Car className="h-4 w-4" />
                        <span>დაამატეთ ახალი ავტომობილი</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Car className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="mb-4">თქვენ ჯერ არ გაქვთ დამატებული ავტომობილები</p>
                      <Button 
                        onClick={() => navigate("/dashboard/cars/new", { state: { returnTo: `/book/${id}` } })}
                      >
                        დაამატეთ ავტომობილი
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {currentStep === "confirmation" && (
                <div className="p-6">
                  <h3 className="text-lg font-medium mb-4">დაადასტურეთ ჯავშანი</h3>
                  
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">სერვისი</p>
                        <p className="font-medium">{bookingData.service_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">თარიღი</p>
                        <p className="font-medium">
                          {bookingData.scheduled_date && 
                           format(bookingData.scheduled_date, "dd/MM/yyyy")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">დრო</p>
                        <p className="font-medium">{bookingData.scheduled_time}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">ავტომობილი</p>
                        <p className="font-medium">{bookingData.car_name}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground mb-1">დამატებითი ინფორმაცია (არააუცილებელი)</p>
                      <Textarea 
                        placeholder="ჩაწერეთ დამატებითი ინფორმაცია ან სპეციალური მოთხოვნები..."
                        value={bookingData.notes} 
                        onChange={handleNotesChange}
                      />
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm">
                        ჯავშნის გაგზავნის შემდეგ, ხელოსანი მიიღებს შეტყობინებას და დაადასტურებს 
                        ან უარყოფს ჯავშანს. ჯავშნის სტატუსის შეცვლის შემთხვევაში მიიღებთ 
                        შეტყობინებას.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {currentStep === "success" && (
                <BookingSuccess mechanic={mechanic} bookingData={bookingData} />
              )}
              
              {/* Navigation buttons */}
              {currentStep !== "success" && (
                <div className="px-6 py-4 bg-muted border-t flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    უკან
                  </Button>
                  
                  {currentStep === "confirmation" && (
                    <Button onClick={handleConfirmBooking}>
                      დაადასტურე ჯავშანი
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BookPage;
