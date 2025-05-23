
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Clock, MapPin, PhoneCall } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

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
  };
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
  
  return (
    <div className="p-6 text-center">
      <div className="flex flex-col items-center justify-center py-6">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 animate-fade-in">
            <CheckCircle className="h-10 w-10" />
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold mb-3 animate-fade-in">
          ჯავშანი წარმატებით გაკეთდა!
        </h2>
        <p className="mb-8 text-muted-foreground max-w-md mx-auto animate-fade-in delay-100">
          თქვენი მოთხოვნა გაეგზავნა {mechanic.profile.first_name} {mechanic.profile.last_name}-ს.
          გთხოვთ დაელოდეთ ჯავშნის დადასტურებას.
        </p>
        
        <Card className="w-full max-w-md mb-8 animate-fade-in delay-200 border-green-100 shadow-md overflow-hidden">
          <div className="bg-green-50 px-4 py-3 border-b border-green-100">
            <h3 className="font-medium text-green-800">ჯავშნის დეტალები</h3>
          </div>
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="px-4 py-3 flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-3">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">თარიღი</p>
                  <p className="font-medium">
                    {bookingData.scheduled_date ? format(bookingData.scheduled_date, "dd MMMM, yyyy") : "—"}
                  </p>
                </div>
              </div>
              
              <div className="px-4 py-3 flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-3">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">დრო</p>
                  <p className="font-medium">{bookingData.scheduled_time || "—"}</p>
                </div>
              </div>
              
              <div className="px-4 py-3 flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-3">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">სერვისი</p>
                  <p className="font-medium">{bookingData.service_name}</p>
                </div>
              </div>

              {mechanic.profile.phone && (
                <div className="px-4 py-3 flex items-center">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <PhoneCall className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">მობილური</p>
                    <a href={`tel:${mechanic.profile.phone}`} className="font-medium text-primary hover:underline">
                      {mechanic.profile.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in delay-300">
          <Button onClick={() => navigate("/dashboard/bookings")} className="px-6">
            ჩემი ჯავშნები
          </Button>
          <Button variant="outline" onClick={() => navigate("/search")}>
            სხვა ხელოსნების ძიება
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
