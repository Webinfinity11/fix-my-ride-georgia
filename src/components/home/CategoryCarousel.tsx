import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, ChevronRight, Wrench, Zap, Settings, Paintbrush, Car, Gauge, Disc, Cog, Fuel, Radio, Snowflake, Shield, Battery,
  Hammer, CircleDot, Droplets, Sparkles, Leaf, Lightbulb, Wind, Key, Sofa, Eye, Layers, Puzzle, Pipette,
  ArrowUpDown, CircleDashed, Package, Flame, RefreshCw, Glasses, Film, Brush, ScanLine, Target, Gem
} from "lucide-react";

interface ServiceCategory {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
}

const categoryPriorityOrder = [
  "ელექტროობა", "ძრავის შეკეთება", "სავალი ნაწილის შეკეთება", "დიაგნოსტიკა",
  "გადაცემათა კოლოფი", "სამღებრო სამუშაოები", "კონდინციონერი(ფრეონი)",
  "ვულკანიზაცია", "ზეთის შეცვლა", "სათუნუქე სამუშაოები",
];

const categoryIcons: Record<string, any> = {
  "აალების სანთლები": Flame,
  "აირბაგი": Shield,
  "აკუმულატორი": Battery,
  "ახალი ნაწილები": Package,
  "გადაცემათა კოლოფი": Cog,
  "გაზის სისტემის მონტაჟი/შეკეთება": Fuel,
  "გამონაბოლქვის სისტემა": Wind,
  "დაშლილები": Package,
  "დიაგნოსტიკა": Gauge,
  "დითეილინგი": Sparkles,
  "დინამოს და სტარტერის შეკეთება": RefreshCw,
  "დისკების შეღებვა/აღდგენა": Disc,
  "ელექტროობა": Zap,
  "ვიზუალური დეტალები": Eye,
  "ვულკანიზაცია": CircleDot,
  "ზეთის შეცვლა": Droplets,
  "თვლების შეყრა": CircleDashed,
  "კარის გაღება": Key,
  "კატალიზატორის სერვისი": Layers,
  "კონდინციონერი(ფრეონი)": Snowflake,
  "მანქანის გასაღები ": Key,
  "მანქანის სალონი": Sofa,
  "მინების დამუქება": Glasses,
  "პლასმასის აღდგენა": Puzzle,
  "პოლირება": Gem,
  "სავალი ნაწილის შეკეთება": Car,
  "სათუნუქე სამუშაოები": Hammer,
  "სამღებრო სამუშაოები": Paintbrush,
  "საქარე მინები": ScanLine,
  "საღებავების შეზავება": Pipette,
  "საჭის სისტემა": ArrowUpDown,
  "ტუნინგი": Target,
  "ფარების აღდგენა": Lightbulb,
  "ფირის გადაკვრა": Film,
  "ქიმწმენდა": Brush,
  "ძრავის შეკეთება": Settings,
  "წვის სისტემა": Flame,
  "წყლის სისტემა": Droplets,
  "ჰიბრიდული სისტემა": Leaf,
  "default": Settings,
};

const CategoryCarousel = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("service_categories")
          .select("id, name, description, icon")
          .order("name");

        if (error) throw error;

        const sortedData = (data || []).sort((a, b) => {
          const aIndex = categoryPriorityOrder.indexOf(a.name);
          const bIndex = categoryPriorityOrder.indexOf(b.name);
          if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name);
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });

        setCategories(sortedData);
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const getIcon = (categoryName: string) => {
    return categoryIcons[categoryName] || categoryIcons.default;
  };

  const handleCategoryClick = (categoryId: number) => {
    navigate(`/services?category=${categoryId}`);
  };

  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden py-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-24 h-24 md:w-28 md:h-28 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 hidden md:flex h-10 w-10 rounded-full bg-white shadow-lg border-primary/20 hover:bg-primary hover:text-primary-foreground transition-colors ${!canScrollPrev && "opacity-0 pointer-events-none"}`}
        onClick={scrollPrev}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 hidden md:flex h-10 w-10 rounded-full bg-white shadow-lg border-primary/20 hover:bg-primary hover:text-primary-foreground transition-colors ${!canScrollNext && "opacity-0 pointer-events-none"}`}
        onClick={scrollNext}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3 md:gap-4 py-2">
          {categories.map((category) => {
            const IconComponent = getIcon(category.name);
            return (
              <button key={category.id} onClick={() => handleCategoryClick(category.id)} className="flex-shrink-0 group">
                <div className="w-24 h-24 md:w-28 md:h-28 flex flex-col items-center justify-center gap-2 bg-white rounded-xl border-2 border-primary/10 hover:border-primary/30 shadow-soft hover:shadow-card transition-all duration-200 group-hover:scale-105">
                  <div className="p-2.5 md:p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full group-hover:from-primary group-hover:to-primary-light transition-colors">
                    <IconComponent className="h-5 w-5 md:h-6 md:w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <span className="text-[10px] md:text-xs font-medium text-foreground text-center px-1 line-clamp-2 leading-tight">
                    {category.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryCarousel;
