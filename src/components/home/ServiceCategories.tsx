
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  Wrench, 
  Car, 
  Gauge, 
  Battery, 
  Cpu, 
  Fan, 
  Wind,
  Cog, 
  AirVent, 
  Fuel, 
  Truck
} from "lucide-react";

type ServiceCategory = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
};

type ServiceCategoriesProps = {
  categories?: ServiceCategory[];
};

const iconMapping: Record<string, React.ReactNode> = {
  "wrench": <Wrench className="h-10 w-10" />,
  "car": <Car className="h-10 w-10" />,
  "gauge": <Gauge className="h-10 w-10" />,
  "battery": <Battery className="h-10 w-10" />,
  "cpu": <Cpu className="h-10 w-10" />,
  "fan": <Fan className="h-10 w-10" />,
  "wind": <Wind className="h-10 w-10" />,
  "cog": <Cog className="h-10 w-10" />,
  "air-vent": <AirVent className="h-10 w-10" />,
  "fuel": <Fuel className="h-10 w-10" />,
  "truck": <Truck className="h-10 w-10" />,
};

// Default categories if none are provided
const defaultCategories: ServiceCategory[] = [
  { id: 1, name: "ძრავი", description: "ძრავის შეკეთება და დიაგნოსტიკა", icon: "wrench" },
  { id: 2, name: "ტრანსმისია", description: "ტრანსმისიის შეკეთება და დიაგნოსტიკა", icon: "cog" },
  { id: 3, name: "საჭე და საკიდარი", description: "საჭისა და საკიდარის სისტემების შემოწმება და შეკეთება", icon: "air-vent" },
  { id: 4, name: "სამუხრუჭე სისტემა", description: "სამუხრუჭე სისტემის შეკეთება და მომსახურება", icon: "gauge" },
  { id: 5, name: "ელექტროობა", description: "ავტომობილის ელექტროსისტემის შეკეთება", icon: "cpu" },
  { id: 6, name: "კონდიცირება", description: "კონდიცირების სისტემის შეკეთება და შევსება", icon: "fan" },
];

const ServiceCategories = ({ categories = defaultCategories }: ServiceCategoriesProps) => {
  const navigate = useNavigate();
  
  // Use the provided categories or defaults
  const displayCategories = categories.length > 0 ? categories : defaultCategories;
  
  const getIcon = (iconName: string | null) => {
    if (!iconName) return <Wrench className="h-10 w-10" />;
    return iconMapping[iconName] || <Wrench className="h-10 w-10" />;
  };
  
  const handleCategoryClick = (categoryId: number) => {
    navigate(`/search?category=${categoryId}`);
  };
  
  return (
    <div className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">ჩვენი სერვისები</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {displayCategories.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
                    {getIcon(category.icon)}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                  {category.description && (
                    <p className="text-muted-foreground mb-4">{category.description}</p>
                  )}
                  <Button 
                    variant="outline"
                    className="mt-2"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    შეთავაზებების ნახვა
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <Button size="lg" onClick={() => navigate('/services')}>
            ყველა სერვისის ნახვა
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCategories;
