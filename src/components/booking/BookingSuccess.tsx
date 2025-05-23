
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

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

type BookingData = {
  service_name: string;
  scheduled_date: Date | null;
  scheduled_time: string | null;
};

interface BookingSuccessProps {
  mechanic: MechanicType;
  bookingData: BookingData;
}

const BookingSuccess = ({ mechanic, bookingData }: BookingSuccessProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="p-6 text-center">
      <div className="flex flex-col items-center justify-center py-8">
        <div className="mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <h2 className="text-2xl font-semibold mb-2">
          ჯავშანი წარმატებით გაკეთდა!
        </h2>
        <p className="mb-6 text-muted-foreground max-w-md mx-auto">
          თქვენი მოთხოვნა გაეგზავნა {mechanic.profile.first_name} {mechanic.profile.last_name}-ს.
          ჯავშნის სტატუსს შეგიძლიათ თვალი ადევნოთ თქვენს პირად გვერდზე.
        </p>
        
        <div className="bg-muted p-4 rounded-lg w-full max-w-sm mb-8">
          <div className="space-y-3 text-left">
            <div>
              <p className="text-sm text-muted-foreground">სერვისი</p>
              <p className="font-medium">{bookingData.service_name}</p>
            </div>
            
            {bookingData.scheduled_date && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                <span>{format(bookingData.scheduled_date, "dd/MM/yyyy")}</span>
              </div>
            )}
            
            {bookingData.scheduled_time && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                <span>{bookingData.scheduled_time}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => navigate("/dashboard/bookings")}>
            ჩემი ჯავშნები
          </Button>
          <Button variant="outline" onClick={() => navigate("/")}>
            მთავარი გვერდი
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
