import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Check, 
  ChevronRight,
  Clock, 
  MapPin, 
  Wrench,
  Star,
  Phone,
  Info,
  CreditCard,
  Banknote
} from "lucide-react";
import { format, addDays, isToday, isBefore, startOfToday } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import BookingSteps from "@/components/booking/BookingSteps";
import BookingSuccess from "@/components/booking/BookingSuccess";
import DateTimeSelector from "@/components/booking/DateTimeSelector";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Define step type
type BookingStep = "service" | "datetime" | "confirmation" | "success";

// Define mechanic type
type MechanicType = {
  id: string;
  profile: {
    first_name: string;
    last_name: string;
    city: string;
    district: string;
    phone?: string | null;
  };
  mechanic_profile: {
    specialization: string | null;
    is_mobile: boolean;
    rating?: number | null;
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
  accepts_card_payment?: boolean;
  accepts_cash_payment?: boolean;
  on_site_service?: boolean;
  car_brands?: string[];
};

// Define booking data type
type BookingData = {
  service_id: number | null;
  service_name: string;
  scheduled_date: Date | null;
  scheduled_time: string | null;
  notes: string;
};

const BookPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<BookingStep>("service");
  const [mechanic, setMechanic] = useState<MechanicType | null>(null);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<BookingData>({
    service_id: null,
    service_name: "",
    scheduled_date: null,
    scheduled_time: null,
    notes: "",
  });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [serviceDetailsOpen, setServiceDetailsOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      toast.error("გთხოვთ გაიაროთ ავტორიზაცია");
      navigate("/login");
    }
  }, [user, navigate]);
  
  // Fetch mechanic and services data
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
            phone,
            mechanic_profiles!inner(specialization, is_mobile, rating)
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
            phone: mechanicData.phone
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

  const handleServiceDetails = (service: ServiceType) => {
    setSelectedService(service);
    setServiceDetailsOpen(true);
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
    
    setConfirmLoading(true);
    
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
          scheduled_date: formattedDate,
          scheduled_time: bookingData.scheduled_time,
          notes: bookingData.notes || null,
          status: "pending"
        });
        
      if (error) {
        throw error;
      }
      
      // Show success message and navigate to success step
      toast.success("ჯავშანი წარმატებით გაკეთდა");
      setCurrentStep("success");
      
    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast.error("ჯავშნის შექმნისას შეცდომა დაფიქსირდა");
    } finally {
      setConfirmLoading(false);
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
      case "confirmation":
        setCurrentStep("datetime");
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
                  <Avatar className="h-14 w-14 border-2 border-primary/20">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h2 className="text-xl font-semibold">
                      {mechanic.profile.first_name} {mechanic.profile.last_name}
                    </h2>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>
                        {mechanic.profile.city}
                        {mechanic.profile.district ? `, ${mechanic.profile.district}` : ""}
                      </span>
                      {mechanic.mechanic_profile.rating && (
                        <>
                          <span className="mx-1">•</span>
                          <div className="flex items-center">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 mr-1" />
                            <span>{mechanic.mechanic_profile.rating}</span>
                          </div>
                        </>
                      )}
                      {mechanic.mechanic_profile.specialization && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{mechanic.mechanic_profile.specialization}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Step content */}
              {currentStep === "service" && (
                <div className="p-6">
                  <h3 className="text-lg font-medium mb-4">აირჩიეთ სერვისი</h3>
                  
                  {services.length > 0 ? (
                    <div className="space-y-3">
                      {services.map((service) => (
                        <div 
                          key={service.id}
                          className="border rounded-lg overflow-hidden hover:border-primary hover:shadow-sm transition-all duration-200"
                        >
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{service.name}</h4>
                                {service.service_categories && (
                                  <p className="text-sm text-muted-foreground">
                                    {service.service_categories.name}
                                  </p>
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
                              </div>
                            </div>
                            
                            {service.description && (
                              <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                                {service.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-2 mt-3">
                              {service.estimated_hours && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {service.estimated_hours} საათი
                                </Badge>
                              )}
                              
                              {service.on_site_service && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  ადგილზე მომსახურება
                                </Badge>
                              )}
                              
                              {service.accepts_cash_payment && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100">
                                  <Banknote className="h-3 w-3 mr-1" />
                                  ქეშით გადახდა
                                </Badge>
                              )}
                              
                              {service.accepts_card_payment && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100">
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  ბარათით გადახდა
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex justify-between mt-4">
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => handleServiceDetails(service)}
                              >
                                <Info className="h-4 w-4 mr-1" />
                                დეტალები
                              </Button>
                              
                              <Button 
                                onClick={() => handleSelectService(service)}
                                className="gap-1"
                              >
                                არჩევა
                                <ChevronRight className="h-4 w-4" />
                              </Button>
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
                    {/* Selected service reminder */}
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">არჩეული სერვისი</p>
                      <p className="font-medium">{bookingData.service_name}</p>
                    </div>
                  
                    {/* Date and Time selector - Using our new component */}
                    <DateTimeSelector 
                      selectedDate={bookingData.scheduled_date}
                      selectedTime={bookingData.scheduled_time}
                      onDateChange={handleSelectDate}
                      onTimeChange={handleSelectTime}
                    />
                  </div>
                </div>
              )}
              
              {currentStep === "confirmation" && (
                <div className="p-6">
                  <h3 className="text-lg font-medium mb-4">დაადასტურეთ ჯავშანი</h3>
                  
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card className="border-muted">
                        <CardContent className="p-4">
                          <div className="flex items-center mb-3">
                            <Wrench className="h-5 w-5 text-primary mr-2" />
                            <p className="text-sm text-muted-foreground">სერვისი</p>
                          </div>
                          <p className="font-medium">{bookingData.service_name}</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-muted">
                        <CardContent className="p-4">
                          <div className="flex items-center mb-3">
                            <CalendarIcon className="h-5 w-5 text-primary mr-2" />
                            <p className="text-sm text-muted-foreground">თარიღი</p>
                          </div>
                          <p className="font-medium">
                            {bookingData.scheduled_date && 
                             format(bookingData.scheduled_date, "dd MMMM, yyyy")}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-muted">
                        <CardContent className="p-4">
                          <div className="flex items-center mb-3">
                            <Clock className="h-5 w-5 text-primary mr-2" />
                            <p className="text-sm text-muted-foreground">დრო</p>
                          </div>
                          <p className="font-medium">{bookingData.scheduled_time}</p>
                        </CardContent>
                      </Card>
                      
                      {mechanic.profile.phone && (
                        <Card className="border-muted">
                          <CardContent className="p-4">
                            <div className="flex items-center mb-3">
                              <Phone className="h-5 w-5 text-primary mr-2" />
                              <p className="text-sm text-muted-foreground">კონტაქტი</p>
                            </div>
                            <p className="font-medium">{mechanic.profile.phone}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground mb-1 text-sm">დამატებითი ინფორმაცია (არააუცილებელი)</p>
                      <Textarea 
                        placeholder="ჩაწერეთ დამატებითი ინფორმაცია ან სპეციალური მოთხოვნები..."
                        value={bookingData.notes} 
                        onChange={handleNotesChange}
                      />
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="flex">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 mr-3" />
                        <p className="text-sm text-blue-700">
                          ჯავშნის გაგზავნის შემდეგ, ხელოსანი მიიღებს შეტყობინებას და დაადასტურებს 
                          ან უარყოფს ჯავშანს. ჯავშნის სტატუსის შეცვლის შემთხვევაში მიიღებთ 
                          შეტყობინებას თქვენს ელ-ფოსტაზე.
                        </p>
                      </div>
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
                    <Button 
                      onClick={handleConfirmBooking} 
                      disabled={confirmLoading}
                      className="flex items-center gap-2"
                    >
                      {confirmLoading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                          დაჯავშნა...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          დაადასტურე ჯავშანი
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Service details dialog */}
      <Dialog open={serviceDetailsOpen} onOpenChange={setServiceDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedService?.name}</DialogTitle>
            <DialogDescription>
              {selectedService?.service_categories?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {selectedService?.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">აღწერა</h4>
                <p className="text-sm">{selectedService.description}</p>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium mb-1">ფასი</h4>
              <p className="font-semibold">
                {selectedService?.price_from && selectedService?.price_to
                  ? `${selectedService.price_from} - ${selectedService.price_to} ₾`
                  : selectedService?.price_from
                    ? `${selectedService.price_from} ₾`
                    : "ფასი შეთანხმებით"}
              </p>
            </div>
            
            {selectedService?.estimated_hours && (
              <div>
                <h4 className="text-sm font-medium mb-1">სავარაუდო დრო</h4>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-muted-foreground mr-1" />
                  <span>{selectedService.estimated_hours} საათი</span>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">გადახდის მეთოდები</h4>
              <div className="flex flex-wrap gap-2">
                {selectedService?.accepts_cash_payment && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100">
                    <Banknote className="h-3 w-3 mr-1" />
                    ქეშით გადახდა
                  </Badge>
                )}
                
                {selectedService?.accepts_card_payment && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100">
                    <CreditCard className="h-3 w-3 mr-1" />
                    ბარათით გადახდა
                  </Badge>
                )}
                
                {!selectedService?.accepts_cash_payment && !selectedService?.accepts_card_payment && (
                  <span className="text-sm text-muted-foreground">ინფორმაცია არ არის მითითებული</span>
                )}
              </div>
            </div>
            
            {selectedService?.on_site_service && (
              <div>
                <h4 className="text-sm font-medium mb-1">ადგილზე მომსახურება</h4>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">
                  <MapPin className="h-3 w-3 mr-1" />
                  შესაძლებელია
                </Badge>
              </div>
            )}
            
            {selectedService?.car_brands && selectedService.car_brands.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">მანქანის მარკები</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedService.car_brands.map((brand) => (
                    <Badge key={brand} variant="outline" className="bg-muted">
                      {brand}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={() => {
                if (selectedService) {
                  handleSelectService(selectedService);
                  setServiceDetailsOpen(false);
                }
              }}
              className="gap-1"
            >
              არჩევა
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookPage;
