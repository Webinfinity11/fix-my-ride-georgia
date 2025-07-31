
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Car, Zap, Settings, Gauge, Paintbrush } from "lucide-react";
import { createCategorySlug } from "@/utils/slugUtils";

type ServiceCategory = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
};

interface ServiceCategoriesProps {
  categories?: ServiceCategory[];
}

const defaultCategories = [
  { id: 1, name: "ძრავის შეკეთება", description: "ძრავის დიაგნოსტიკა და შეკეთება", icon: "engine" },
  { id: 2, name: "ელექტროობა", description: "ელექტრო სისტემების სერვისი", icon: "electric" },
  { id: 3, name: "საკიდი სისტემა", description: "საკიდი სისტემის შეკეთება", icon: "suspension" },
  { id: 4, name: "სამუხრუჭე სისტემა", description: "სამუხრუჭე სისტემის სერვისი", icon: "brakes" },
  { id: 5, name: "დიაგნოსტიკა", description: "კომპიუტერული დიაგნოსტიკა", icon: "diagnostic" },
  { id: 6, name: "საღებავი სამუშაოები", description: "საღებავი და კორპუსის შეკეთება", icon: "paint" }
];

const getIcon = (iconName: string | null) => {
  switch (iconName) {
    case "engine":
      return <Settings className="h-8 w-8 text-primary" />;
    case "electric":
      return <Zap className="h-8 w-8 text-primary" />;
    case "suspension":
    case "brakes":
      return <Car className="h-8 w-8 text-primary" />;
    case "diagnostic":
      return <Gauge className="h-8 w-8 text-primary" />;
    case "paint":
      return <Paintbrush className="h-8 w-8 text-primary" />;
    default:
      return <Wrench className="h-8 w-8 text-primary" />;
  }
};

const ServiceCategories = ({ categories }: ServiceCategoriesProps) => {
  const navigate = useNavigate();
  const servicesToShow = categories && categories.length > 0 ? categories : defaultCategories;

  const handleCategoryClick = (category: ServiceCategory) => {
    const slug = createCategorySlug(category.name);
    navigate(`/services/${slug}`);
  };

  return (
    <section className="py-16 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">ჩვენი სერვისები</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            აღმოაჩინეთ ჩვენი მრავალფეროვანი სერვისები ავტომობილებისთვის. დააჭირეთ სასურველ კატეგორიას შესაბამისი ხელოსნების სანახავად.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {servicesToShow.map((category) => (
            <Card 
              key={category.id} 
              className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 bg-white border-2 hover:border-primary/30"
              onClick={() => handleCategoryClick(category)}
            >
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  {getIcon(category.icon)}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-primary">
                  {category.name}
                </h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  {category.description || "პროფესიონალური სერვისი თქვენი ავტომობილისთვის"}
                </p>
                <Button 
                  variant="outline" 
                  className="w-full hover:bg-primary hover:text-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategoryClick(category);
                  }}
                >
                  ხელოსნების ნახვა
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate('/services')}
            className="hover:bg-primary hover:text-white transition-colors"
          >
            ყველა სერვისის ნახვა
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ServiceCategories;
