
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

  // Check if date is available (disable past dates)
  const isDateUnavailable = (date: Date) => {
    return isBefore(date, startOfToday()) && !isToday(date);
  };

  return (
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
                !selectedDate && "text-muted-foreground"
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
              onSelect={onDateChange}
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
      {selectedDate && (
        <div className="animate-fade-in">
          <p className="text-sm text-muted-foreground mb-2">დრო:</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {availableTimes.map((time) => (
              <Button
                key={time}
                variant={selectedTime === time ? "default" : "outline"}
                className={cn(
                  "py-2",
                  selectedTime === time ? "bg-primary" : "hover:bg-primary/5"
                )}
                onClick={() => onTimeChange(time)}
              >
                {time}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimeSelector;
