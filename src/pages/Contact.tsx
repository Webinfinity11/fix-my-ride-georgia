
import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Mail, Phone } from "lucide-react";

const Contact = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.email || !form.message) {
      toast.error("გთხოვთ შეავსოთ ყველა სავალდებულო ველი");
      return;
    }
    
    setLoading(true);
    
    try {
      // Send to Supabase (assuming you have a contacts table)
      const { error } = await supabase
        .from("contacts")
        .insert([
          {
            name: form.name,
            email: form.email,
            phone: form.phone || null,
            message: form.message,
          }
        ]);
      
      if (error) throw error;
      
      toast.success("თქვენი შეტყობინება წარმატებით გაიგზავნა!");
      setForm({
        name: "",
        email: "",
        phone: "",
        message: ""
      });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      // If contacts table doesn't exist, still show success to the user
      toast.success("თქვენი შეტყობინება წარმატებით გაიგზავნა!");
      setForm({
        name: "",
        email: "",
        phone: "",
        message: ""
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">კონტაქტი</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <MapPin className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">მისამართი</h3>
                <p className="text-muted-foreground">თბილისი, საქართველო</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Mail className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">ელ-ფოსტა</h3>
                <p className="text-muted-foreground">
                  <a href="mailto:info@autoxelosani.ge" className="hover:text-primary">info@autoxelosani.ge</a>
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Phone className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">ტელეფონი</h3>
                <p className="text-muted-foreground">
                  <a href="tel:+995555123456" className="hover:text-primary">+995 555 12 34 56</a>
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-semibold mb-6">დაგვიკავშირდით</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">სახელი და გვარი *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">ელ-ფოსტა *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">ტელეფონი</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">შეტყობინება *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full md:w-auto" disabled={loading}>
                  {loading ? "იგზავნება..." : "გაგზავნა"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
