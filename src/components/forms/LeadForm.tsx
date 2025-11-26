import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, User, Phone, MessageSquare, Send, CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  full_name: z.string().min(2, "სახელი და გვარი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს"),
  phone: z.string().min(9, "ტელეფონის ნომერი არასწორია").max(20, "ტელეფონის ნომერი ძალიან გრძელია"),
  comment: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface LeadFormProps {
  leadType: "leasing" | "dealers" | "insurance" | "service" | "drive" | "laundry" | "vacancy";
  title: string;
  description?: string;
  onSuccess?: () => void;
}

export function LeadForm({ leadType, title, description, onSuccess }: LeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      comment: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    console.log('🚀 Form submission started');
    console.log('📝 Form values:', values);
    console.log('🏷️ Lead type:', leadType);
    
    try {
      const { error } = await supabase.from("auto_leads").insert({
        full_name: values.full_name,
        phone: values.phone,
        comment: values.comment || null,
        lead_type: leadType,
        status: "new",
      });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Insert successful');
      setIsSuccess(true);
      toast.success("თქვენი განაცხადი წარმატებით გაიგზავნა!", {
        description: "ჩვენი მენეჯერი მალე დაგიკავშირდებათ",
      });

      form.reset();
      
      // Reset success state after 2 seconds and call onSuccess
      setTimeout(() => {
        console.log('🔄 Resetting success state and calling onSuccess');
        setIsSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch (error: any) {
      console.error("❌ Error submitting lead:", error);
      toast.error("დაფიქსირდა შეცდომა", {
        description: "გთხოვთ სცადოთ მოგვიანებით",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl border-0 overflow-hidden rounded-2xl">
      {/* Header with gradient */}
      <CardHeader className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 text-white p-6 lg:p-8">
        <CardTitle className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
          <Send className="h-6 w-6 lg:h-8 lg:w-8" />
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-white/95 text-base lg:text-lg mt-2">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-white">
        {isSuccess ? (
          // Success State
          <div className="text-center py-12 animate-in fade-in duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle2 className="h-8 w-8 lg:h-10 lg:w-10 text-green-600" />
            </div>
            <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
              წარმატებით გაიგზავნა!
            </h3>
            <p className="text-gray-600">
              ჩვენი მენეჯერი მალე დაგიკავშირდებათ
            </p>
          </div>
        ) : (
          // Form
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Full Name Field */}
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base lg:text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      სახელი და გვარი *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="მაგ: გიორგი ქართველიშვილი"
                        {...field}
                        className="h-12 lg:h-14 text-base lg:text-lg border-2 border-gray-200 focus:border-primary rounded-xl transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                      />
                    </FormControl>
                    <FormMessage className="text-sm" />
                  </FormItem>
                )}
              />

              {/* Phone Field */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base lg:text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      ტელეფონი *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="მაგ: 555123456"
                        {...field}
                        className="h-12 lg:h-14 text-base lg:text-lg border-2 border-gray-200 focus:border-primary rounded-xl transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                      />
                    </FormControl>
                    <FormMessage className="text-sm" />
                  </FormItem>
                )}
              />

              {/* Comment Field */}
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base lg:text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      კომენტარი <span className="text-sm font-normal text-gray-500">(არა სავალდებულო)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="დაწერეთ დამატებითი ინფორმაცია..."
                        {...field}
                        className="min-h-[120px] text-base lg:text-lg border-2 border-gray-200 focus:border-primary rounded-xl transition-all duration-200 resize-none bg-white shadow-sm hover:shadow-md"
                      />
                    </FormControl>
                    <FormMessage className="text-sm" />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 lg:h-14 text-base lg:text-lg font-semibold bg-gradient-to-r from-primary via-blue-600 to-purple-600 hover:from-primary/90 hover:via-blue-600/90 hover:to-purple-600/90 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    იგზავნება...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    განაცხადის გაგზავნა
                  </>
                )}
              </Button>

              {/* Info Text */}
              <p className="text-center text-sm text-gray-500 mt-4">
                * აღნიშნული ველები სავალდებულოა
              </p>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
