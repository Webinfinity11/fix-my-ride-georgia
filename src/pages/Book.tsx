import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { 
  CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  ArrowLeft,
  CheckCircle,
  Loader2,
  Star
} from "lucide-react";

type ServiceType = {
  id: number;
  name: string;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  estimated_hours: number | null;
  city: string | null;
  district: string | null;
  mechanic: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string | null;
    rating: number | null;
  };
  category: {
    name: string;
  } | null;
};

type MechanicType = {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  city?: string;
  district?: string;
  rating: number | null;
  specialization: string | null;
  is_mobile: boolean;
};

const timeSlots = [
  "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", 
  "17:00", "18:00"
];

const Book = () => {
  const [searchParams] = useSearchParams();
  const { mechanicId: paramMechanicId } = useParams();
  const navigate = useNavigate();
  const serviceId = searchParams.get("service");
  const mechanicId = searchParams.get("mechanic") || paramMechanicId;
  const { user } = useAuth();
  
  const [service, setService] = useState<ServiceType | null>(null);
  const [mechanic, setMechanic] = useState<MechanicType | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // UUID validation function
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  useEffect(() => {
    console.log("📝 Book component mounted with params:", { serviceId, mechanicId, paramMechanicId });
    
    if (!user) {
      toast.error("გთხოვთ შედით სისტემაში");
      navigate("/login");
      return;
    }

    if (serviceId) {
      console.log("🔧 Fetching service data for ID:", serviceId);
      fetchService();
    } else if (mechanicId) {
      console.log("👨‍🔧 Checking mechanic ID format:", mechanicId);
      
      // Validate mechanic ID format
      if (!isValidUUID(mechanicId)) {
        console.error("❌ Invalid mechanic ID format:", mechanicId);
        toast.error("არასწორი ხელოსნის ID ფორმატი");
        navigate("/services-detail");
        return;
      }
      
      console.log("✅ Valid mechanic UUID, fetching data");
      fetchMechanic();
    } else {
      toast.error("სერვისი ან ხელოსანი არ არის მითითებული");
      navigate("/services-detail");
    }
  }, [serviceId, mechanicId, user, navigate]);

  const fetchService = async () => {
    if (!serviceId) return;

    try {
      setLoading(true);
      console.log("🔍 Fetching service with ID:", serviceId);
      
      const { data: serviceData, error: serviceError } = await supabase
        .from("mechanic_services")
        .select(`
          id,
          name,
          description,
          price_from,
          price_to,
          estimated_hours,
          city,
          district,
          mechanic_id,
          service_categories(name),
          mechanic_profiles(
            rating,
            specialization,
            is_mobile,
            profiles(
              id,
              first_name,
              last_name,
              phone
            )
          )
        `)
        .eq("id", parseInt(serviceId))
        .eq("is_active", true)
        .single();

      if (serviceError) {
        console.error("❌ Service fetch error:", serviceError);
        throw serviceError;
      }

      if (!serviceData) {
        toast.error("სერვისი ვერ მოიძებნა");
        navigate("/services-detail");
        return;
      }

      console.log("✅ Service data fetched:", serviceData);

      const mechanicProfile = Array.isArray(serviceData.mechanic_profiles) 
        ? serviceData.mechanic_profiles[0] 
        : serviceData.mechanic_profiles;
        
      const profile = mechanicProfile?.profiles;
      const profileData = Array.isArray(profile) ? profile[0] : profile;

      const transformedService: ServiceType = {
        id: serviceData.id,
        name: serviceData.name,
        description: serviceData.description,
        price_from: serviceData.price_from,
        price_to: serviceData.price_to,
        estimated_hours: serviceData.estimated_hours,
        city: serviceData.city,
        district: serviceData.district,
        mechanic: {
          id: profileData?.id || serviceData.mechanic_id || "",
          first_name: profileData?.first_name || "",
          last_name: profileData?.last_name || "",
          phone: profileData?.phone || null,
          rating: mechanicProfile?.rating || null,
        },
        category: serviceData.service_categories
      };

      setService(transformedService);

      // Set mobile service if mechanic supports it
      if (mechanicProfile?.is_mobile) {
        setIsMobile(false); // User can choose
      }
      
    } catch (error: any) {
      console.error("❌ Error fetching service:", error);
      toast.error("სერვისის ჩატვირთვისას შეცდომა დაფიქსირდა");
      navigate("/services-detail");
    } finally {
      setLoading(false);
    }
  };

  const fetchMechanic = async () => {
    if (!mechanicId) return;

    try {
      setLoading(true);
      console.log("🔍 Fetching mechanic with ID:", mechanicId);
      
      const { data: mechanicData, error: mechanicError } = await supabase
        .from("profiles")
        .select(`
          id,
          first_name,
          last_name,
          phone,
          city,
          district,
          mechanic_profiles(rating, specialization, is_mobile)
        `)
        .eq("id", mechanicId)
        .single();

      if (mechanicError) {
        console.error("❌ Mechanic fetch error:", mechanicError);
        throw mechanicError;
      }

      if (!mechanicData) {
        toast.error("ხელოსანი ვერ მოიძებნა");
        navigate("/services-detail");
        return;
      }

      console.log("✅ Mechanic data fetched:", mechanicData);

      const mechanicProfile = Array.isArray(mechanicData.mechanic_profiles) 
        ? mechanicData.mechanic_profiles[0] 
        : mechanicData.mechanic_profiles;

      const transformedMechanic: MechanicType = {
        id: mechanicData.id,
        first_name: mechanicData.first_name,
        last_name: mechanicData.last_name,
        phone: mechanicData.phone,
        city: mechanicData.city,
        district: mechanicData.district,
        rating: mechanicProfile?.rating || null,
        specialization: mechanicProfile?.specialization || null,
        is_mobile: mechanicProfile?.is_mobile || false
      };

      setMechanic(transformedMechanic);
      
    } catch (error: any) {
      console.error("❌ Error fetching mechanic:", error);
      toast.error("ხელოსნის ჩატვირთვისას შეცდომა დაფიქსირდა");
      navigate("/services-detail");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("გთხოვთ შედით სისტემაში");
      return;
    }

    if (!date) {
      toast.error("გთხოვთ აირჩიოთ თარიღი");
      return;
    }

    if (!time) {
      toast.error("გთხოვთ აირჩიოთ დრო");
      return;
    }

    if (isMobile && !address.trim()) {
      toast.error("გთხოვთ მიუთითოთ მისამართი");
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error("გთხოვთ მიუთითოთ ტელეფონის ნომერი");
      return;
    }

    setSubmitting(true);

    try {
      const targetMechanicId = service?.mechanic.id || mechanicId!;
      console.log("📝 Submitting booking with mechanic ID:", targetMechanicId);

      // Validate mechanic ID before submitting
      if (!isValidUUID(targetMechanicId)) {
        console.error("❌ Invalid mechanic ID format for booking:", targetMechanicId);
        toast.error("არასწორი ხელოსნის ID");
        return;
      }

      const bookingData = {
        user_id: user.id,
        mechanic_id: targetMechanicId,
        service_id: serviceId ? parseInt(serviceId) : null,
        scheduled_date: format(date, "yyyy-MM-dd"),
        scheduled_time: time,
        is_mobile_service: isMobile,
        address: isMobile ? address.trim() : null,
        phone_number: phoneNumber.trim(),
        notes: notes.trim() || null,
        status: "pending"
      };

      console.log("📋 Booking data to submit:", bookingData);

      const { error } = await supabase
        .from("bookings")
        .insert([bookingData]);

      if (error) {
        console.error("❌ Booking submission error:", error);
        throw error;
      }

      console.log("✅ Booking submitted successfully");
      toast.success("ჯავშანი წარმატებით გაიგზავნა!");
      
      // Navigate to success page or dashboard
      navigate("/dashboard/bookings");
      
    } catch (error: any) {
      console.error("❌ Error submitting booking:", error);
      toast.error("ჯავშნის გაგზავნისას შეცდომა დაფიქსირდა");
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (priceFrom: number | null, priceTo: number | null) => {
    if (!priceFrom && !priceTo) return "ფასი შეთანხმებით";
    if (priceFrom && priceTo && priceFrom !== priceTo) {
      return `${priceFrom}-${priceTo} ₾`;
    }
    return `${priceFrom || priceTo} ₾`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>იტვირთება...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const displayName = service ? service.name : mechanic ? `${mechanic.first_name} ${mechanic.last_name}` : "";
  const mechanicInfo = service?.mechanic || mechanic;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-muted py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back button */}
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-6 hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              უკან დაბრუნება
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Booking Form */}
              <div className="lg:col-span-2">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                      ჯავშნის ფორმა
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Service/Mechanic Info */}
                      <div className="bg-primary/5 p-4 rounded-lg">
                        <h3 className="font-medium text-lg mb-2">{displayName}</h3>
                        {service?.category && (
                          <p className="text-sm text-muted-foreground">{service.category.name}</p>
                        )}
                        {service?.description && (
                          <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                        )}
                      </div>

                      {/* Date Selection */}
                      <div className="space-y-2">
                        <Label>თარიღი *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date ? format(date, "PPP") : "აირჩიეთ თარიღი"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={setDate}
                              disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Time Selection */}
                      <div className="space-y-2">
                        <Label>დრო *</Label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {timeSlots.map((slot) => (
                            <Button
                              key={slot}
                              type="button"
                              variant={time === slot ? "default" : "outline"}
                              onClick={() => setTime(slot)}
                              className="text-sm"
                            >
                              {slot}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Mobile Service */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="mobile"
                          checked={isMobile}
                          onCheckedChange={(checked) => setIsMobile(checked === true)}
                        />
                        <Label htmlFor="mobile">ადგილზე მისვლის სერვისი</Label>
                      </div>

                      {/* Address for mobile service */}
                      {isMobile && (
                        <div className="space-y-2">
                          <Label htmlFor="address">მისამართი *</Label>
                          <Input
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="მიუთითეთ ზუსტი მისამართი"
                            required
                          />
                        </div>
                      )}

                      {/* Phone Number */}
                      <div className="space-y-2">
                        <Label htmlFor="phone">ტელეფონის ნომერი *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="მაგ: 595123456"
                          required
                        />
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label htmlFor="notes">დამატებითი ინფორმაცია</Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="მიუთითეთ დამატებითი დეტალები..."
                          rows={3}
                        />
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={submitting || !date || !time}
                        className="w-full bg-primary hover:bg-primary/90"
                        size="lg"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            იგზავნება...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            ჯავშნის გაგზავნა
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Mechanic Info */}
                {mechanicInfo && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        ხელოსანი
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <h3 className="font-semibold text-lg">
                          {mechanicInfo.first_name} {mechanicInfo.last_name}
                        </h3>
                        {mechanicInfo.rating && (
                          <div className="flex items-center justify-center gap-1 mt-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{mechanicInfo.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      {mechanicInfo.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-primary" />
                          <span>{mechanicInfo.phone}</span>
                        </div>
                      )}

                      {(service?.city || mechanic?.city) && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>
                            {service?.city || mechanic?.city}
                            {(service?.district || mechanic?.district) && 
                              `, ${service?.district || mechanic?.district}`}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Service Details */}
                {service && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle>სერვისის დეტალები</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ფასი:</span>
                        <span className="font-medium">
                          {formatPrice(service.price_from, service.price_to)}
                        </span>
                      </div>
                      {service.estimated_hours && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ხანგრძლივობა:</span>
                          <span className="font-medium">{service.estimated_hours} საათი</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Book;
