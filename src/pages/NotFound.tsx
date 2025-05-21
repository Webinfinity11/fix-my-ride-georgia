
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-4">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-2xl font-medium text-gray-800 mb-2">გვერდი ვერ მოიძებნა</p>
        <p className="text-gray-600 mb-6">მოთხოვნილი გვერდი „{location.pathname}" არ არსებობს.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="default" asChild>
            <Link to="/" className="flex items-center gap-2">
              <Home size={18} />
              მთავარ გვერდზე დაბრუნება
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2">
            <ArrowLeft size={18} />
            უკან დაბრუნება
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
