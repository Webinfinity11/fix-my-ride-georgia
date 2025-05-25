
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

type MechanicType = {
  id: string;
  first_name: string;
  last_name: string;
  rating: number | null;
  profile: {
    specialization: string | null;
    hourly_rate: number | null;
    is_mobile: boolean | null;
  } | null;
  mechanic_profile: {
    rating: number | null;
  } | null;
};

const Book = () => {
  const [searchParams] = useSearchParams();
  const mechanicId = searchParams.get("mechanicId");
  const serviceId = searchParams.get("serviceId");
  const { user } = useAuth();
  const [mechanic, setMechanic] = useState<MechanicType | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fetchMechanic = async () => {
      if (mechanicId) {
        try {
          const { data: mechanicData, error: mechanicError } = await supabase
            .from("profiles")
            .select(`
              id,
              first_name,
              last_name,
              mechanic_profiles(
                rating,
                specialization,
                hourly_rate,
                is_mobile
              )
            `)
            .eq("id", mechanicId)
            .single();

          if (mechanicError) throw mechanicError;

          // Format the mechanic data to match MechanicType
          const formattedMechanic: MechanicType = {
            id: mechanicData.id,
            first_name: mechanicData.first_name,
            last_name: mechanicData.last_name,
            rating: mechanicData.mechanic_profiles?.rating || null,
            profile: {
              specialization: mechanicData.mechanic_profiles?.specialization || null,
              hourly_rate: mechanicData.mechanic_profiles?.hourly_rate || null,
              is_mobile: mechanicData.mechanic_profiles?.is_mobile || null,
            },
            mechanic_profile: {
              rating: mechanicData.mechanic_profiles?.rating || null,
            },
          };

          setMechanic(formattedMechanic);
        } catch (error: any) {
          console.error("Error fetching mechanic:", error);
          toast.error("ხელოსნის მონაცემების ჩატვირთვისას შეცდომა დაფიქსირდა");
        }
      }
    };

    fetchMechanic();
  }, [mechanicId]);

  const handleSubmit = async (e: any) => {
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

    if (!serviceId) {
      toast.error("სერვისი არ არის მითითებული");
      return;
    }

    try {
      const { error } = await supabase
        .from("bookings")
        .insert({
          mechanic_id: mechanicId!,
          service_id: parseInt(serviceId),
          scheduled_date: format(date, "yyyy-MM-dd"),
          scheduled_time: time,
          notes: notes || null,
          user_id: user.id,
        });

      if (error) throw error;

      toast.success("თქვენი მოთხოვნა წარმატებით გაიგზავნა");
    } catch (error: any) {
      console.error("Error submitting booking:", error);
      toast.error("მოთხოვნის გაგზავნისას შეცდომა დაფიქსირდა");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-background rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">
              მოითხოვეთ ხელოსანი
            </h1>

            {mechanic ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="mechanic">ხელოსანი</Label>
                  <Input
                    type="text"
                    id="mechanic"
                    value={`${mechanic.first_name} ${mechanic.last_name}`}
                    className="bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="date">თარიღი</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        {date ? (
                          format(date, "PPP")
                        ) : (
                          <span>აირჩიეთ თარიღი</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) =>
                          date < new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="time">დრო</Label>
                  <Input
                    type="time"
                    id="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="isMobile" className="flex items-center space-x-2">
                    <Checkbox
                      id="isMobile"
                      checked={isMobile}
                      onCheckedChange={(checked) => setIsMobile(!!checked)}
                    />
                    <span>გამოძახებით</span>
                  </Label>
                </div>

                {isMobile && (
                  <div>
                    <Label htmlFor="address">მისამართი</Label>
                    <Input
                      type="text"
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="მიუთითეთ მისამართი"
                      required={isMobile}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">დამატებითი ინფორმაცია</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="დამატებითი ინფორმაცია"
                  />
                </div>

                <Button className="w-full" type="submit">
                  გაგზავნა
                </Button>
              </form>
            ) : (
              <p className="text-center text-muted-foreground">
                ხელოსანი ვერ მოიძებნა
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Book;
