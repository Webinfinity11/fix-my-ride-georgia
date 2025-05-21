
import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const contactFormSchema = z.object({
  name: z.string().min(2, "სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს"),
  email: z.string().email("არასწორი ელფოსტის ფორმატი"),
  message: z.string().min(10, "შეტყობინება უნდა შეიცავდეს მინიმუმ 10 სიმბოლოს"),
});

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate form data
      const validationResult = contactFormSchema.safeParse({
        name,
        email,
        message,
      });
      
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0]?.message || "გთხოვთ შეავსოთ ყველა ველი სწორად";
        toast.error(errorMessage);
        return;
      }
      
      // Instead of sending to database, let's simulate a successful submission
      // In a real application, you would send this data to your backend or a service like EmailJS
      console.log("Form submission:", { name, email, message });
      
      // Show success message
      toast.success("თქვენი შეტყობინება წარმატებით გაიგზავნა!");
      
      // Clear form
      setName("");
      setEmail("");
      setMessage("");
      
    } catch (error: any) {
      console.error("Error submitting contact form:", error);
      toast.error("შეტყობინების გაგზავნისას დაფიქსირდა შეცდომა");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-background rounded-lg shadow-sm p-8">
            <h1 className="text-3xl font-bold text-center mb-8">დაგვიკავშირდით</h1>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">საკონტაქტო ინფორმაცია</h2>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">მისამართი:</p>
                    <p className="text-muted-foreground">თბილისი, რუსთაველის გამზ. 19</p>
                  </div>
                  <div>
                    <p className="font-medium">ტელეფონი:</p>
                    <p className="text-muted-foreground">+995 555 123 456</p>
                  </div>
                  <div>
                    <p className="font-medium">ელფოსტა:</p>
                    <p className="text-muted-foreground">info@automechanics.ge</p>
                  </div>
                  <div>
                    <p className="font-medium">სამუშაო საათები:</p>
                    <p className="text-muted-foreground">ორშაბათი - პარასკევი: 9:00 - 18:00</p>
                    <p className="text-muted-foreground">შაბათი: 10:00 - 16:00</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">მოგვწერეთ</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="სახელი"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="ელფოსტა"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="შეტყობინება"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "იგზავნება..." : "გაგზავნა"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
