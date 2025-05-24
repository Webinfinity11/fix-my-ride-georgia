
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import SearchFilter from "@/components/home/SearchFilter";
import ServiceCategories from "@/components/home/ServiceCategories";
import HowItWorks from "@/components/home/HowItWorks";
import { Button } from "@/components/ui/button";
import MechanicCard from "@/components/mechanic/MechanicCard";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

type ServiceCategory = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
};

const Index = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("service_categories")
          .select("*")
          .order("id", { ascending: true })
          .limit(6); // Show only first 6 categories on homepage

        if (error) throw error;
        setCategories(data || []);
      } catch (error: any) {
        console.error("Error fetching service categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <Hero />
        <SearchFilter />
        
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">ჩვენი სერვისები</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                აღმოაჩინეთ ჩვენი მრავალფეროვანი სერვისები ავტომობილებისთვის. ჩვენ გთავაზობთ მაღალი ხარისხის მომსახურებას სხვადასხვა საჭიროებისთვის.
              </p>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-muted rounded-lg p-6 animate-pulse">
                    <div className="h-12 w-12 bg-primary/20 rounded-full mb-4"></div>
                    <div className="h-6 bg-primary/20 rounded mb-2"></div>
                    <div className="h-4 bg-primary/20 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <ServiceCategories categories={categories} />
            )}
            
            <div className="text-center mt-8">
              <Link to="/services">
                <Button variant="outline" size="lg">
                  ყველა სერვისის ნახვა
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <HowItWorks />

        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">რეკომენდირებული ხელოსნები</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                გაეცანით ჩვენს საუკეთესო ხელოსნებს, რომლებიც გამოირჩევიან მაღალი პროფესიონალიზმითა და საიმედოობით.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {featuredMechanics.map((mechanic) => (
                <MechanicCard 
                  key={mechanic.id} 
                  id={mechanic.id}
                  name={mechanic.name}
                  avatar={mechanic.avatar}
                  specialization={mechanic.specialization}
                  location={mechanic.location}
                  rating={mechanic.rating}
                  reviewCount={mechanic.reviewCount}
                  verified={mechanic.verified}
                  services={mechanic.services}
                />
              ))}
            </div>
            
            <div className="text-center">
              <Link to="/service-search">
                <Button size="lg">
                  ყველა ხელოსნის ნახვა
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
