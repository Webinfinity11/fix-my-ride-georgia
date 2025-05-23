
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
  "gas-pump": <Fuel className="h-10 w-10" />, // Using Fuel icon for gas-pump
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
    <div className="py-16 md:py-24 bg-gradient-to-b from-background to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark">
            პოპულარული სერვისები
          </h2>
          <div className="w-24 h-1 mx-auto bg-secondary rounded-full mb-4"></div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            აირჩიეთ თქვენთვის საჭირო სერვისი და იპოვეთ საუკეთესო ხელოსანი მის შესასრულებლად
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {featuredCategories.map((category, index) => (
            <Card 
              key={category.id} 
              className="group hover:shadow-hover transition-all duration-300 border-none shadow-card hover:-translate-y-2 overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="p-5 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                    {getIcon(category.icon)}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{category.name}</h3>
                  {category.description && (
                    <p className="text-muted-foreground mb-5 line-clamp-2">{category.description}</p>
                  )}
                  <Button 
                    variant="outline"
                    className="mt-2 group-hover:bg-primary group-hover:text-white transition-colors duration-300"
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
            <div className="text-center mb-10">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">ყველა სერვისი</h3>
              <div className="w-16 h-1 mx-auto bg-secondary/70 rounded-full"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 mb-16">
              {remainingCategories.map((category) => (
                <Card key={category.id} className="group hover:shadow-hover transition-all duration-300 border border-border/50">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-full bg-primary/5 text-primary mb-3 group-hover:bg-primary/10 transition-colors duration-300">
                        {getIcon(category.icon)}
                      </div>
                      <h4 className="text-sm font-medium mb-3">{category.name}</h4>
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="mt-1 text-xs group-hover:text-primary transition-colors"
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
          <Button 
            size="lg" 
            onClick={() => navigate('/services')}
            className="bg-gradient-to-r from-secondary to-secondary-light hover:opacity-90 transition-opacity shadow-md hover:shadow-lg"
          >
            ყველა სერვისის ნახვა
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCategories;
