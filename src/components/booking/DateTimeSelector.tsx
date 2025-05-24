
import { useState, useEffect } from "react";
import { format, addDays, isToday, isBefore, startOfToday } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateTimeSelectorProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
}

const DateTimeSelector = ({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
}: DateTimeSelectorProps) => {
  const [availableTimes, setAvailableTimes] = useState<string[]>([
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
    "15:00", "16:00", "17:00", "18:00"
  ]);
  const [showTimes, setShowTimes] = useState(false);

  // Show time slots when date is selected
  useEffect(() => {
    if (selectedDate) {
      setShowTimes(true);
    }
  }, [selectedDate]);

  // Check if date is available (disable past dates)
  const isDateUnavailable = (date: Date) => {
    return isBefore(date, startOfToday()) && !isToday(date);
  };

  const handleDateSelect = (date: Date | undefined) => {
    onDateChange(date);
    if (date) {
      // Small delay to ensure smooth animation
      setTimeout(() => setShowTimes(true), 100);
    } else {
      setShowTimes(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date selector */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">აირჩიეთ თარიღი:</p>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-12 border-2",
                !selectedDate && "text-muted-foreground",
                selectedDate && "border-primary text-primary"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? (
                format(selectedDate, "PPP")
              ) : (
                <span>აირჩიეთ თარიღი</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={handleDateSelect}
              disabled={isDateUnavailable}
              initialFocus
              fromDate={new Date()}
              toDate={addDays(new Date(), 30)}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Time slots */}
      {selectedDate && showTimes && (
        <div className="animate-fade-in">
          <p className="text-sm font-medium text-gray-700 mb-3">აირჩიეთ დრო:</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {availableTimes.map((time) => (
              <Button
                key={time}
                variant={selectedTime === time ? "default" : "outline"}
                className={cn(
                  "h-12 font-medium transition-all duration-200",
                  selectedTime === time 
                    ? "bg-primary text-white border-primary shadow-md scale-105" 
                    : "hover:bg-primary/10 hover:border-primary/50 hover:scale-105"
                )}
                onClick={() => onTimeChange(time)}
              >
                <Clock className="h-4 w-4 mr-1" />
                {time}
              </Button>
            ))}
          </div>
          
          {selectedTime && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-primary font-medium">
                ✓ შერჩეული დრო: {format(selectedDate, "dd MMMM yyyy")} - {selectedTime}
              </p>
            </div>
          )}
        </div>
      )}
      
      {selectedDate && !showTimes && (
        <div className="text-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">იტვირთება...</p>
        </div>
      )}
    </div>
  );
};

export default DateTimeSelector;
