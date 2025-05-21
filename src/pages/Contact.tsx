
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-muted py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-10 text-center">დაგვიკავშირდით</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">გამოგვიგზავნეთ შეტყობინება</h2>
              
              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">სახელი</label>
                    <Input id="name" placeholder="თქვენი სახელი" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">ელ-ფოსტა</label>
                    <Input id="email" type="email" placeholder="თქვენი ელ-ფოსტა" />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-1">თემა</label>
                  <Input id="subject" placeholder="შეტყობინების თემა" />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-1">შეტყობინება</label>
                  <Textarea id="message" placeholder="თქვენი შეტყობინება" rows={5} />
                </div>
                
                <Button type="submit" className="w-full">გაგზავნა</Button>
              </form>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">საკონტაქტო ინფორმაცია</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-primary mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium">ტელეფონი</h3>
                    <p className="text-muted-foreground">+995 511 123 456</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-primary mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium">ელ-ფოსტა</h3>
                    <p className="text-muted-foreground">info@avtoxelosani.ge</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium">მისამართი</h3>
                    <p className="text-muted-foreground">რუსთაველის გამზირი 42, თბილისი, საქართველო</p>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium mb-2">სამუშაო საათები</h3>
                  <p className="text-sm mb-1">ორშაბათი - პარასკევი: 9:00 - 18:00</p>
                  <p className="text-sm mb-1">შაბათი: 10:00 - 16:00</p>
                  <p className="text-sm">კვირა: დასვენების დღე</p>
                </div>
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
