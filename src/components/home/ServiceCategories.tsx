
import { Link } from 'react-router-dom';
import { 
  Car, Wrench, Battery, Gauge, Settings, Calendar, MapPin, Star
} from 'lucide-react';

// Type definition for service categories
type ServiceCategory = {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  url: string;
};

const categories: ServiceCategory[] = [
  {
    id: 1,
    name: "ძრავის შეკეთება",
    description: "ძრავის დიაგნოსტიკა, შეკეთება და მოვლა",
    icon: <Car className="h-8 w-8" />,
    url: "/search?category=engine",
  },
  {
    id: 2,
    name: "სამუხრუჭე სისტემა",
    description: "მუხრუჭების დისკების და ხუნდების შეცვლა",
    icon: <Gauge className="h-8 w-8" />,
    url: "/search?category=brakes",
  },
  {
    id: 3,
    name: "ელექტროსისტემა",
    description: "აკუმულატორის და ელ. სისტემის შეკეთება",
    icon: <Battery className="h-8 w-8" />,
    url: "/search?category=electrical",
  },
  {
    id: 4,
    name: "გადაცემათა კოლოფი",
    description: "მანუალური და ავტომატური გადაცემათა კოლოფი",
    icon: <Settings className="h-8 w-8" />,
    url: "/search?category=transmission",
  },
  {
    id: 5,
    name: "გეგმიური მომსახურება",
    description: "ზეთის შეცვლა და ტექ. მომსახურება",
    icon: <Calendar className="h-8 w-8" />,
    url: "/search?category=maintenance",
  },
  {
    id: 6,
    name: "დიაგნოსტიკა",
    description: "კომპიუტერული და ვიზუალური დიაგნოსტიკა",
    icon: <Wrench className="h-8 w-8" />,
    url: "/search?category=diagnostics",
  },
];

const ServiceCategories = () => {
  return (
    <section className="section-padding bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">სერვისების კატეგორიები</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            გთავაზობთ მრავალფეროვან ავტომობილის შეკეთების სერვისებს. აირჩიეთ სასურველი კატეგორია და იპოვეთ შესაფერისი ხელოსანი.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link key={category.id} to={category.url} className="card-hover">
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center">
                <div className="p-3 bg-primary/10 rounded-full text-primary mb-5">
                  {category.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                <p className="text-muted-foreground">{category.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceCategories;
