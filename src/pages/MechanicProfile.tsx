
import { useState } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check, MapPin, Phone, Mail, Star, Clock, Wrench, FileCheck, Car } from "lucide-react";
import { toast } from "sonner";

// Mock data for this example
const mechanic = {
  id: 1,
  name: "გიორგი გიორგაძე",
  avatar: "",
  specialization: "ძრავის სპეციალისტი",
  description: "მაქვს 15+ წლიანი გამოცდილება ავტომობილების შეკეთებაში. სპეციალიზირებული ვარ გერმანულ და იაპონურ მანქანებზე. ვმუშაობ უახლესი დიაგნოსტიკური მოწყობილობებით და ვიყენებ მხოლოდ მაღალი ხარისხის ნაწილებს.",
  experience: 15,
  location: "თბილისი, საბურთალო",
  address: "საბურთალოს ქ. 15",
  phone: "+995 555 12 34 56",
  email: "giorgi@example.com",
  workHours: "ორშ-პარ: 10:00 - 19:00, შაბ: 10:00 - 17:00",
  rating: 4.8,
  reviewCount: 124,
  verified: true,
  services: [
    { id: 1, name: "ძრავის შეკეთება", price: "250₾ - 1500₾", duration: "1-3 დღე" },
    { id: 2, name: "დიაგნოსტიკა", price: "50₾", duration: "1 საათი" },
    { id: 3, name: "ელექტროსისტემა", price: "100₾ - 500₾", duration: "1-2 დღე" },
    { id: 4, name: "ზეთის შეცვლა", price: "70₾", duration: "30 წუთი" },
    { id: 5, name: "გადაცემათა კოლოფი", price: "300₾ - 800₾", duration: "1-2 დღე" },
  ],
  certifications: ["BMW სერტიფიცირებული სპეციალისტი", "Toyota ტექნიკური სპეციალისტი"],
  reviews: [
    {
      id: 1,
      author: "ლევანი",
      rating: 5,
      date: "2023-04-15",
      comment: "საუკეთესო ხელოსანი ვისთანაც კი მიმუშავია. ზუსტად დიაგნოსტირება და სწრაფი შეკეთება."
    },
    {
      id: 2,
      author: "ნინო",
      rating: 4,
      date: "2023-03-22",
      comment: "კარგი სპეციალისტია, მაგრამ ცოტა ძვირი. თუმცა ხარისხი ანაზღაურებს."
    }
  ]
};

const MechanicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("services");
  
  // Generate initials from name for avatar fallback
  const initials = mechanic.name
    .split(" ")
    .map((n) => n[0])
    .join("");
    
  const handleBooking = () => {
    // In a real app, this would navigate to booking page or open booking modal
    toast.success("დაჯავშნის პროცესი დაიწყო!");
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero section with mechanic info */}
      <main className="flex-grow bg-muted">
        <div className="bg-primary text-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24 rounded-full border-4 border-white">
                <AvatarImage src={mechanic.avatar} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{mechanic.name}</h1>
                  {mechanic.verified && (
                    <Badge className="bg-green-500 text-white flex items-center">
                      <Check className="h-3 w-3 mr-1" /> დადასტურებული
                    </Badge>
                  )}
                </div>
                
                <p className="text-blue-100 mb-2">{mechanic.specialization}</p>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-semibold">{mechanic.rating}</span>
                    <span className="text-blue-100 ml-1">({mechanic.reviewCount} შეფასება)</span>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-1 text-blue-200" />
                    <span>{mechanic.location}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Wrench className="h-5 w-5 mr-1 text-blue-200" />
                    <span>{mechanic.experience} წლიანი გამოცდილება</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {mechanic.certifications.map((cert, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-600 text-white">
                      <FileCheck className="h-3 w-3 mr-1" /> {cert}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="bg-secondary hover:bg-secondary-light text-white shrink-0"
                onClick={handleBooking}
              >
                <Calendar className="h-5 w-5 mr-2" /> დაჯავშნა
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left sidebar with contact info */}
            <div className="order-2 lg:order-1 lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">საკონტაქტო ინფორმაცია</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium">მისამართი</p>
                      <p className="text-muted-foreground">{mechanic.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-muted-foreground shrink-0 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium">ტელეფონი</p>
                      <p className="text-muted-foreground">{mechanic.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-muted-foreground shrink-0 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium">ელ-ფოსტა</p>
                      <p className="text-muted-foreground">{mechanic.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-muted-foreground shrink-0 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium">სამუშაო საათები</p>
                      <p className="text-muted-foreground">{mechanic.workHours}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">სპეციალიზაცია</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-muted">
                    <Car className="h-3 w-3 mr-1" /> BMW
                  </Badge>
                  <Badge variant="outline" className="bg-muted">
                    <Car className="h-3 w-3 mr-1" /> Mercedes
                  </Badge>
                  <Badge variant="outline" className="bg-muted">
                    <Car className="h-3 w-3 mr-1" /> Toyota
                  </Badge>
                  <Badge variant="outline" className="bg-muted">
                    <Car className="h-3 w-3 mr-1" /> Honda
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Main content area with tabs */}
            <div className="order-1 lg:order-2 lg:col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <Tabs defaultValue="services" onValueChange={setActiveTab}>
                  <div className="px-6 pt-6 border-b">
                    <TabsList className="grid grid-cols-3">
                      <TabsTrigger value="services">სერვისები</TabsTrigger>
                      <TabsTrigger value="about">შესახებ</TabsTrigger>
                      <TabsTrigger value="reviews">შეფასებები</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="services" className="p-6">
                    <div className="space-y-6">
                      {mechanic.services.map((service) => (
                        <div key={service.id} className="border-b border-gray-100 last:border-0 pb-5 last:pb-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-lg font-medium">{service.name}</h4>
                              <div className="flex items-center gap-6 mt-2 text-muted-foreground text-sm">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>{service.duration}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold">{service.price}</p>
                              <Button 
                                size="sm" 
                                className="mt-2 bg-secondary hover:bg-secondary-light"
                                onClick={() => toast.success(`სერვისი "${service.name}" დაემატა დაჯავშნის პროცესს`)}
                              >
                                დაჯავშნა
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="about" className="p-6">
                    <h3 className="text-lg font-semibold mb-4">ჩემს შესახებ</h3>
                    <p className="text-muted-foreground mb-6">{mechanic.description}</p>
                    
                    <h3 className="text-lg font-semibold mb-4">სერტიფიკატები</h3>
                    <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-2">
                      {mechanic.certifications.map((cert, index) => (
                        <li key={index}>{cert}</li>
                      ))}
                    </ul>
                  </TabsContent>
                  
                  <TabsContent value="reviews" className="p-6">
                    <div className="flex items-center mb-8">
                      <div className="bg-primary/10 rounded-xl p-4 text-center mr-6">
                        <p className="text-3xl font-bold text-primary">{mechanic.rating}</p>
                        <div className="flex justify-center my-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < Math.floor(mechanic.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">{mechanic.reviewCount} შეფასებიდან</p>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-1">მომხმარებლების შეფასებები</h3>
                        <p className="text-muted-foreground">მომხმარებლების გამოცდილების საფუძველზე</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {mechanic.reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{review.author}</p>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground text-sm mb-3">{review.date}</p>
                          <p>{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MechanicProfile;
