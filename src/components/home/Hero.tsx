
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';

const Hero = () => {
  return (
    <div className="relative bg-gradient-to-r from-primary to-primary-dark py-20 md:py-32">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-y-0 left-1/3 w-1/3 bg-white/5 transform -skew-x-12"></div>
        <div className="absolute inset-y-0 right-1/4 w-1/5 bg-white/5 transform skew-x-12"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
            იპოვეთ საუკეთესო ავტო ხელოსანი თქვენი მანქანისთვის
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-10">
            სანდო ხელოსნები, მარტივი დაჯავშნა, უმაღლესი ხარისხის სერვისი.
            ჩვენი პლატფორმა გეხმარებათ იპოვოთ და დაუკავშირდეთ გამოცდილ ხელოსნებს თქვენს ახლოს.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/search">
              <Button size="lg" className="bg-secondary hover:bg-secondary-light text-white font-semibold px-6 py-6 w-full sm:w-auto">
                <Search className="h-5 w-5 mr-2" />
                მოძებნე ხელოსანი
              </Button>
            </Link>
            <Link to="/register?type=mechanic">
              <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20 font-semibold px-6 py-6 w-full sm:w-auto">
                დარეგისტრირდი, როგორც ხელოსანი
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
