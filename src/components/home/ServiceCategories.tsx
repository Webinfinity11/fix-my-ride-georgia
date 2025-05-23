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
  Truck,
  Circle,
  Zap,
  Package,
  Scissors,
  Key,
  Layers,
  Palette,
  Eye,
  Sliders,
  RotateCw,
  Flame,
  Filter,
  Droplets,
  Sparkles,
  Sun,
  Disc
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
  "circle": <Circle className="h-10 w-10" />,
  "zap": <Zap className="h-10 w-10" />,
  "package": <Package className="h-10 w-10" />,
  "scissors": <Scissors className="h-10 w-10" />,
  "key": <Key className="h-10 w-10" />,
  "layers": <Layers className="h-10 w-10" />,
  "palette": <Palette className="h-10 w-10" />,
  "eye": <Eye className="h-10 w-10" />,
  "sliders": <Sliders className="h-10 w-10" />,
  "rotate-cw": <RotateCw className="h-10 w-10" />,
  "flame": <Flame className="h-10 w-10" />,
  "filter": <Filter className="h-10 w-10" />,
  "gas-pump": <Fuel className="h-10 w-10" />, // Changed from GasPump to Fuel
  "droplets": <Droplets className="h-10 w-10" />,
  "sparkles": <Sparkles className="h-10 w-10" />,
  "sun": <Sun className="h-10 w-10" />,
  "disc": <Disc className="h-10 w-10" />,
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

  // Show just the top 6 categories in the main grid
  const featuredCategories = displayCategories.slice(0, 6);
  // Remaining categories for a secondary grid with smaller cards
  const remainingCategories = displayCategories.slice(6);
  
  return (
    <div className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">პოპულარული სერვისები</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {featuredCategories.map((category) => (
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

        {remainingCategories.length > 0 && (
          <>
            <h3 className="text-xl md:text-2xl font-bold text-center mb-8">ყველა სერვისი</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-12">
              {remainingCategories.map((category) => (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-full bg-primary/10 text-primary mb-3">
                        {getIcon(category.icon)}
                      </div>
                      <h4 className="text-sm font-medium mb-2">{category.name}</h4>
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="mt-1 text-xs"
                        onClick={() => handleCategoryClick(category.id)}
                      >
                        ნახვა
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
        
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
