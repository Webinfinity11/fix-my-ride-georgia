import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { useVIPServices } from "@/hooks/useVIPServices";
import ServiceCard from "@/components/services/ServiceCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Crown, ArrowRight, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const VIPServicesCarousel = () => {
  const navigate = useNavigate();
  const { services, loading, error } = useVIPServices(10);

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

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Don't show section if no VIP services
  if (!loading && services.length === 0) {
    return null;
  }

  return (
    <section className="py-10 md:py-16 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/50">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <Badge className="mb-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5">
                <Crown className="h-4 w-4 mr-2" />
                VIP სერვისები
              </Badge>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
                რეკომენდებული სერვისები
              </h2>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">
                ყველაზე პოპულარული და მაღალი რეიტინგის მქონე სერვისები
              </p>
            </div>

            <Link to="/services?vip=true">
              <Button
                variant="outline"
                className="border-amber-500 text-amber-700 hover:bg-amber-50 group"
              >
                ყველას ნახვა
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Carousel Container */}
          <div className="relative">
            {/* Navigation Buttons */}
            <Button
              variant="outline"
              size="icon"
              className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 hidden lg:flex h-12 w-12 rounded-full bg-white shadow-lg border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all ${
                !canScrollPrev && "opacity-0 pointer-events-none"
              }`}
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 hidden lg:flex h-12 w-12 rounded-full bg-white shadow-lg border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all ${
                !canScrollNext && "opacity-0 pointer-events-none"
              }`}
              onClick={scrollNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            {/* Carousel */}
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-4 md:gap-6">
                {loading ? (
                  // Loading skeletons
                  [...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 w-[85%] sm:w-[45%] md:w-[32%] lg:w-[24%]"
                    >
                      <div className="bg-white rounded-lg border border-primary/10 overflow-hidden">
                        <Skeleton className="aspect-[4/3] w-full" />
                        <div className="p-4 space-y-3">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  services.map((service) => (
                    <div
                      key={service.id}
                      className="flex-shrink-0 w-[85%] sm:w-[45%] md:w-[32%] lg:w-[24%]"
                    >
                      <ServiceCard service={service} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Mobile Scroll Indicator */}
          <div className="flex justify-center gap-1.5 mt-6 md:hidden">
            {services.slice(0, 5).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === 0 ? "w-6 bg-amber-500" : "w-1.5 bg-amber-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VIPServicesCarousel;
