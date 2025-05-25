
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Clock, MapPin, PhoneCall, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type ProfileType = {
  first_name?: string;
  last_name?: string;
  city?: string;
  district?: string;
  phone?: string | null;
};

type MechanicProfileType = {
  specialization?: string | null;
  is_mobile?: boolean;
};

type MechanicType = {
  id: string;
  profile?: ProfileType;
  mechanic_profile?: MechanicProfileType;
};

type BookingData = {
  service_name: string;
  scheduled_date: Date | null;
  scheduled_time: string | null;
  notes?: string | null;
};

interface BookingSuccessProps {
  mechanic: MechanicType;
  bookingData: BookingData;
}

const BookingSuccess = ({ mechanic, bookingData }: BookingSuccessProps) => {
  const navigate = useNavigate();
  
  // Safely access nested properties with fallbacks
  const profile = mechanic?.profile || {};
  const mechanicProfile = mechanic?.mechanic_profile || {};
  
  const firstName = profile.first_name || "";
  const lastName = profile.last_name || "";
  const phone = profile.phone || null;
  
  return (
    <div className="p-6">
      <div className="flex flex-col items-center justify-center py-6 animate-fade-in">
        <div className="mb-6 relative">
          <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse opacity-50 scale-150"></div>
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold mb-2 text-center animate-fade-in">
          ჯავშანი წარმატებით გაკეთდა!
        </h2>
        <p className="mb-8 text-muted-foreground max-w-md text-center animate-fade-in delay-100">
          თქვენი მოთხოვნა გაეგზავნა <span className="font-medium">{firstName} {lastName}</span>-ს.
          დაელოდეთ ჯავშნის დადასტურებას.
        </p>
        
        <Card className="w-full max-w-md mb-8 animate-fade-in delay-200 border border-green-200 shadow-md overflow-hidden">
          <div className="bg-green-50 px-4 py-3 border-b border-green-100 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="font-medium text-green-800">ჯავშნის დეტალები</h3>
          </div>
          
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="p-4 flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-grow">
                  <p className="text-sm text-muted-foreground">სერვისი</p>
                  <p className="font-medium">{bookingData.service_name || "—"}</p>
                </div>
              </div>
              
              <div className="p-4 flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-grow">
                  <p className="text-sm text-muted-foreground">თარიღი</p>
                  <p className="font-medium">
                    {bookingData.scheduled_date ? format(bookingData.scheduled_date, "dd MMMM, yyyy") : "—"}
                  </p>
                </div>
              </div>
              
              <div className="p-4 flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-grow">
                  <p className="text-sm text-muted-foreground">დრო</p>
                  <p className="font-medium">{bookingData.scheduled_time || "—"}</p>
                </div>
              </div>

              {phone && (
                <div className="p-4 flex items-center">
                  <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0">
                    <PhoneCall className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm text-muted-foreground">კონტაქტი</p>
                    <a href={`tel:${phone}`} className="font-medium text-primary hover:underline flex items-center">
                      {phone}
                    </a>
                  </div>
                </div>
              )}
              
              {bookingData.notes && (
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">დამატებითი ინფორმაცია</p>
                  <p className="text-sm">{bookingData.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md animate-fade-in delay-300">
          <Button 
            onClick={() => navigate("/dashboard/bookings")} 
            className="w-full flex items-center justify-center gap-2"
            size="lg"
          >
            ჩემი ჯავშნები
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate("/search")}
            className="w-full"
            size="lg"
          >
            სხვა ხელოსნების ძიება
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
