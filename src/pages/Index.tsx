
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import SearchFilter from "@/components/home/SearchFilter";
import ServiceCategories from "@/components/home/ServiceCategories";
import HowItWorks from "@/components/home/HowItWorks";
import { Button } from "@/components/ui/button";
import MechanicCard from "@/components/mechanic/MechanicCard";
import { Link } from "react-router-dom";

// Sample featured mechanics data
const featuredMechanics = [
  {
    id: "1",
    name: "გიორგი გიორგაძე",
    avatar: "",
    specialization: "ძრავის სპეციალისტი",
    location: "თბილისი, საბურთალო",
    rating: 4.8,
    reviewCount: 124,
    verified: true,
    services: ["ძრავის შეკეთება", "დიაგნოსტიკა", "ელექტროობა"]
  },
  {
    id: "2",
    name: "ნიკა მაისურაძე",
    avatar: "",
    specialization: "საჭის სისტემა, სამუხრუჭე სისტემა",
    location: "თბილისი, ვაკე",
    rating: 4.6,
    reviewCount: 98,
    verified: true,
    services: ["საჭის სისტემა", "სამუხრუჭე სისტემა", "საკიდი"]
  },
  {
    id: "3",
    name: "თემურ კახიძე",
    avatar: "",
    specialization: "ელექტრო სისტემების სპეციალისტი",
    location: "თბილისი, დიდუბე",
    rating: 4.7,
    reviewCount: 87,
    verified: false,
    services: ["ელექტროობა", "კომპიუტერული დიაგნოსტიკა", "სტარტერი და გენერატორი"]
  }
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <Hero />
        
        {/* Search Filter Section */}
        <SearchFilter />
        
        {/* Service Categories */}
        <ServiceCategories />
        
        {/* How It Works */}
        <HowItWorks />
        
        {/* Featured Mechanics */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">გამორჩეული ხელოსნები</h2>
                <p className="text-muted-foreground max-w-2xl">
                  გაეცანით ჩვენს საუკეთესო ხელოსნებს მაღალი რეიტინგითა და დადებითი შეფასებებით.
                </p>
              </div>
              <Link to="/search" className="mt-4 md:mt-0">
                <Button variant="outline">
                  ყველა ხელოსანი
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredMechanics.map((mechanic) => (
                <MechanicCard 
                  key={mechanic.id}
                  {...mechanic}
                />
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-14 bg-primary">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                ხართ ავტო ხელოსანი?
              </h2>
              <p className="text-lg text-blue-100 mb-8">
                დარეგისტრირდით პლატფორმაზე, გააფართოვეთ თქვენი ბიზნესი და მიიღეთ მეტი მომხმარებელი.
                დაიწყეთ უფასოდ და გაზარდეთ თქვენი შემოსავალი.
              </p>
              <Link to="/register?type=mechanic">
                <Button 
                  size="lg"
                  className="bg-secondary hover:bg-secondary-light text-white font-semibold px-6 py-6"
                >
                  დარეგისტრირდი, როგორც ხელოსანი
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
