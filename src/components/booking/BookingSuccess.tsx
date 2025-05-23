
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Calendar } from "lucide-react";
import { format } from "date-fns";

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

interface BookingSuccessProps {
  mechanic: MechanicType;
  bookingData: BookingData;
}

const BookingSuccess = ({ mechanic, bookingData }: BookingSuccessProps) => {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      
      <h3 className="text-2xl font-bold mb-2">ჯავშანი წარმატებით გაკეთდა!</h3>
      
      <p className="text-muted-foreground mb-6">
        თქვენი ჯავშანი {mechanic.profile.first_name} {mechanic.profile.last_name}-თან გაგზავნილია.
        ელოდეთ დასტურს ხელოსნისგან.
      </p>
      
      <div className="bg-muted p-4 rounded-lg mb-6 inline-block">
        <div className="flex items-center justify-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            {bookingData.scheduled_date && format(bookingData.scheduled_date, "dd/MM/yyyy")}, 
            {bookingData.scheduled_time}
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        <Link to="/dashboard/bookings">
          <Button className="w-full sm:w-auto">
            ნახეთ თქვენი ჯავშნები
          </Button>
        </Link>
        <div>
          <Link to="/" className="text-sm text-muted-foreground hover:underline">
            დაბრუნდით მთავარ გვერდზე
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
