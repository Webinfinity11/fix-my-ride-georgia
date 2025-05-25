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
  const [mechanic, setMechanic] = useState<MechanicType | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [isMobile, setIsMobile] = useState(false);
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

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
              profile:profiles(specialization, hourly_rate, is_mobile),
              mechanic_profile:mechanic_profiles(rating)
            `)
            .eq("id", mechanicId)
            .single();

          if (mechanicError) throw mechanicError;

          // Adjust the structure to match MechanicType
          const formattedMechanic = {
            id: mechanicData.id,
            first_name: mechanicData.first_name,
            last_name: mechanicData.last_name,
            rating: mechanicData.mechanic_profile?.rating || null,
            profile: mechanicData.profile,
            mechanic_profile: mechanicData.mechanic_profile,
          };

          setMechanic(formattedMechanic as MechanicType);
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

    if (!date) {
      toast.error("გთხოვთ აირჩიოთ თარიღი");
      return;
    }

    if (isMobile && !address) {
      toast.error("გთხოვთ მიუთითოთ მისამართი");
      return;
    }

    try {
      const { error } = await supabase
        .from("bookings")
        .insert({
          mechanic_id: mechanicId,
          date: date.toISOString(),
          is_mobile: isMobile,
          address: address,
          description: description,
          user_id: supabase.auth.user()?.id,
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
                  <Label htmlFor="description">აღწერა</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
