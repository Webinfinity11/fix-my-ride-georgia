import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, TrendingUp } from "lucide-react";

// Critical hero content that renders immediately
const HeroSection = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Mark as loaded after initial render
    setIsLoaded(true);
  }, []);

  const popularSearches = [
    "ძრავის შეკეთება", "ელექტროობა", "დიაგნოსტიკა", "ზეთის შეცვლა"
  ];

  const handleQuickSearch = (query: string) => {
    window.location.href = `/services?q=${encodeURIComponent(query)}`;
  };

  return (
    <section className="hero-bg critical-content">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-blue-50 to-purple-50"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-blue-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-200/20 to-primary/10 rounded-full blur-3xl"></div>
      
      <div className="container hero-content">
        <div className="max-w-6xl mx-auto">
          {/* Hero Content */}
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              საქართველოს #1 ავტო-სერვისის პლატფორმა
            </Badge>
            
            <h1 className="hero-title">
              იპოვეთ საუკეთესო 
              <span className="hero-gradient-text block lg:inline lg:ml-4">
                ხელოსანი
              </span>
            </h1>

            <p className="hero-subtitle">
              სწრაფი, საიმედო და ხარისხიანი ავტო-სერვისი თქვენი მანქანისთვის
            </p>

            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link to="/services">
                <Button size="lg" className="btn-primary text-lg px-8 py-4">
                  <Search className="h-5 w-5 mr-2" />
                  ძიება დაიწყე
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-2">
                  რეგისტრაცია
                </Button>
              </Link>
            </div>
          </div>

          {/* Popular Searches */}
          <div className={`mb-10 ${isLoaded ? 'non-critical loaded' : 'non-critical'}`}>
            <div className="flex items-center justify-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-semibold text-gray-700">პოპულარული ძიებები</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2 lg:gap-3">
              {popularSearches.map((search) => (
                <Button
                  key={search}
                  variant="outline"
                  onClick={() => handleQuickSearch(search)}
                  className="text-sm lg:text-base rounded-full border-2 border-primary/20 hover:border-primary hover:bg-primary hover:text-white transition-all duration-200 bg-white/80 backdrop-blur-sm"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {search}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;