
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Phone, MapPin, MessageSquare, Send } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

// Define form schema with validation
const formSchema = z.object({
  name: z.string().min(2, { message: "სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს" }),
  email: z.string().email({ message: "გთხოვთ შეიყვანეთ სწორი ელ-ფოსტა" }),
  subject: z.string().min(5, { message: "თემა უნდა შეიცავდეს მინიმუმ 5 სიმბოლოს" }),
  message: z.string().min(10, { message: "შეტყობინება უნდა შეიცავდეს მინიმუმ 10 სიმბოლოს" }),
  topic: z.string().min(1, { message: "აირჩიეთ შეტყობინების ტიპი" }),
});

// Contact topics
const contactTopics = [
  { value: "general", label: "ზოგადი კითხვა" },
  { value: "technical", label: "ტექნიკური დახმარება" },
  { value: "mechanics", label: "ხელოსნები და სერვისები" },
  { value: "partnership", label: "თანამშრომლობა" },
  { value: "suggestion", label: "წინადადება/უკუკავშირი" },
  { value: "other", label: "სხვა" },
];

// Office locations
const officeLocations = [
  {
    city: "თბილისი",
    address: "ვაჟა-ფშაველას გამზ. 76",
    phone: "+995 32 222 33 44",
    email: "tbilisi@avtokhelo.ge",
    hours: "ორშ - პარ: 10:00 - 18:00",
  },
  {
    city: "ბათუმი",
    address: "ჭავჭავაძის ქ. 78",
    phone: "+995 32 222 55 66",
    email: "batumi@avtokhelo.ge",
    hours: "ორშ - პარ: 10:00 - 18:00",
  },
];

// FAQ items
const faqItems = [
  {
    question: "როგორ დავრეგისტრირდე როგორც ხელოსანი?",
    answer: "ხელოსნად დასარეგისტრირებლად, გთხოვთ შეხვიდეთ რეგისტრაციის გვერდზე, აირჩიოთ 'ხელოსანი' და შეავსოთ საჭირო ინფორმაცია თქვენს შესახებ, კვალიფიკაციასა და სერვისებზე.",
  },
  {
    question: "როგორ დავჯავშნო სერვისი?",
    answer: "სერვისის დასაჯავშნად, მოძებნეთ შესაბამისი ხელოსანი ძიების გვერდზე, აირჩიეთ სასურველი სერვისი და დააჭირეთ ღილაკს 'დაჯავშნა'. შეავსეთ საჭირო ინფორმაცია და აირჩიეთ თქვენთვის სასურველი დრო.",
  },
  {
    question: "შემიძლია თუ არა შევცვალო ან გავაუქმო დაჯავშნა?",
    answer: "დიახ, შეგიძლიათ შეცვალოთ ან გააუქმოთ დაჯავშნა თქვენი პირადი კაბინეტის 'დაჯავშნები' განყოფილებაში. გაითვალისწინეთ, რომ გაუქმება შესაძლებელია სერვისის დაწყებამდე 24 საათით ადრე.",
  },
  {
    question: "რა ღირს სერვისები?",
    answer: "სერვისების ფასები განისაზღვრება ინდივიდუალურად თითოეული ხელოსნის მიერ. ფასები შეგიძლიათ ნახოთ ხელოსნის პროფილზე ან სერვისის დეტალებში.",
  },
  {
    question: "როგორ შეუძლია მომხმარებელს შეაფასოს სერვისი?",
    answer: "სერვისის შესრულების შემდეგ, მომხმარებელს შეუძლია შეაფასოს ხელოსანი და დატოვოს შეფასება თავისი პირადი კაბინეტის 'დაჯავშნები' განყოფილებაში.",
  },
];

const Contact = () => {
  const { user } = useAuth();
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user ? `${user.firstName} ${user.lastName}` : "",
      email: user?.email || "",
      subject: "",
      message: "",
      topic: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setFormSubmitting(true);
    try {
      // Send contact form data to Supabase
      const { error } = await supabase.from("contact_messages").insert({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        topic: data.topic,
        user_id: user?.id,
      });

      if (error) throw error;
      
      toast.success("თქვენი შეტყობინება გაიგზავნა");
      form.reset({
        name: user ? `${user.firstName} ${user.lastName}` : "",
        email: user?.email || "",
        subject: "",
        message: "",
        topic: "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("შეტყობინების გაგზავნა ვერ მოხერხდა");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-muted py-12">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">დაგვიკავშირდით</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              გაქვთ შეკითხვები ან გჭირდებათ დახმარება? ჩვენი გუნდი მზადაა დაგეხმაროთ. 
              გამოგვიგზავნეთ შეტყობინება და უმოკლეს ვადაში გიპასუხებთ.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-6">მოგვწერეთ</h2>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>სახელი და გვარი</FormLabel>
                              <FormControl>
                                <Input placeholder="თქვენი სახელი და გვარი" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ელ-ფოსტა</FormLabel>
                              <FormControl>
                                <Input placeholder="თქვენი ელ-ფოსტა" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="topic"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>შეტყობინების ტიპი</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="აირჩიეთ ტიპი" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {contactTopics.map((topic) => (
                                    <SelectItem key={topic.value} value={topic.value}>{topic.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>თემა</FormLabel>
                              <FormControl>
                                <Input placeholder="შეტყობინების თემა" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>შეტყობინება</FormLabel>
                            <FormControl>
                              <Textarea placeholder="დაწერეთ თქვენი შეტყობინება..." className="min-h-32" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={formSubmitting}>
                        {formSubmitting ? 'იგზავნება...' : 'გაგზავნა'}
                        <Send className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-6">საკონტაქტო ინფორმაცია</h2>
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 text-primary mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-medium">ტელეფონი</h3>
                        <p className="text-muted-foreground">+995 32 222 22 22</p>
                        <p className="text-sm text-muted-foreground">ორშ - პარ: 10:00 - 18:00</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 text-primary mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-medium">ელ-ფოსტა</h3>
                        <p className="text-muted-foreground">info@avtokhelo.ge</p>
                        <p className="text-muted-foreground">support@avtokhelo.ge</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <h3 className="font-semibold text-lg">ჩვენი ოფისები</h3>
                    
                    {officeLocations.map((office, index) => (
                      <div key={index} className="flex items-start">
                        <MapPin className="h-5 w-5 text-primary mr-3 mt-0.5" />
                        <div>
                          <h3 className="font-medium">{office.city}</h3>
                          <p className="text-muted-foreground">{office.address}</p>
                          <p className="text-muted-foreground">{office.phone}</p>
                          <p className="text-sm text-muted-foreground">{office.hours}</p>
                        </div>
                      </div>
                    ))}
                    
                    <Separator />
                    
                    <h3 className="font-semibold text-lg">გვიპასუხეთ სწრაფად</h3>
                    <div className="flex items-start">
                      <MessageSquare className="h-5 w-5 text-primary mr-3 mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">
                          გჭირდებათ სწრაფი პასუხი? გამოიყენეთ ჩვენი ლაივ ჩატი 
                          სამუშაო საათებში.
                        </p>
                        <Button variant="outline" className="mt-2">
                          ჩატის გახსნა
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold mb-6 text-center">ხშირად დასმული კითხვები</h2>
            <div className="max-w-3xl mx-auto">
              {faqItems.map((faq, index) => (
                <div key={index} className="mb-4">
                  <button
                    className="flex justify-between items-center w-full px-4 py-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-all"
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  >
                    <span className="font-medium text-left">{faq.question}</span>
                    <span className="text-primary">
                      {expandedFaq === index ? "−" : "+"}
                    </span>
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 py-3 bg-white rounded-b-lg shadow-sm -mt-1 border-t">
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Map Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-center">ჩვენი მდებარეობა</h2>
            <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">აქ განთავსდება Google Maps რუკა</p>
              {/* 
                TODO: Add Google Maps component here
                This would require a Google Maps API key and the appropriate component
              */}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
