import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Fuel, Zap, MapPin, ArrowRight } from "lucide-react";

const StationsPromo = () => {
  return (
    <section className="py-10 md:py-16 bg-gradient-to-br from-muted via-background to-accent/30">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-primary to-primary-light text-primary-foreground px-4 py-1.5">
              <MapPin className="h-4 w-4 mr-2" />
              რუკაზე ნახვა
            </Badge>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3">
              საწვავი და ელექტრო სადგურები
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
              იპოვეთ უახლოესი საწვავის სადგური ან ელექტრო დამტენი ჩვენს რუკაზე
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fuel Stations Card */}
            <Link to="/map/stations">
              <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-secondary/10 to-secondary/5 cursor-pointer h-full">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-4">
                    <div className="p-4 bg-gradient-to-br from-secondary to-secondary-dark rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Fuel className="h-8 w-8 text-secondary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                        საწვავის სადგურები
                      </h3>
                      <p className="text-muted-foreground mb-4 text-sm md:text-base">
                        SOCAR, WISSOL, GULF, ROMPETROL, PORTAL
                      </p>
                      
                      {/* Brand Logos */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {["socar", "wissol", "gulf", "rompetrol"].map((brand) => (
                          <div
                            key={brand}
                            className="w-10 h-10 bg-card rounded-lg shadow-sm flex items-center justify-center overflow-hidden"
                          >
                            <img
                              src={`/fuel-company-logos/${brand}-logo.${brand === "socar" ? "svg" : "png"}`}
                              alt={brand}
                              className="w-8 h-8 object-contain"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-3xl md:text-4xl font-bold text-secondary">550+</span>
                          <span className="text-foreground ml-2 text-sm md:text-base">სადგური</span>
                        </div>
                        <Button
                          variant="ghost"
                          className="text-secondary hover:text-secondary-dark hover:bg-secondary/10 group-hover:translate-x-1 transition-transform"
                        >
                          რუკაზე ნახვა
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Electric Chargers Card */}
            <Link to="/map/chargers">
              <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 cursor-pointer h-full">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-4">
                    <div className="p-4 bg-gradient-to-br from-primary to-primary-light rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Zap className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                        ელექტრო სადგურები
                      </h3>
                      <p className="text-muted-foreground mb-4 text-sm md:text-base">
                        ელექტრო მანქანების დამტენები მთელი საქართველოს მასშტაბით
                      </p>

                      {/* Charger Types */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          <Zap className="h-3 w-3 mr-1" />
                          სწრაფი დამტენი
                        </Badge>
                        <Badge variant="secondary" className="bg-accent text-accent-foreground">
                          Level 2
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-3xl md:text-4xl font-bold text-primary">100+</span>
                          <span className="text-foreground ml-2 text-sm md:text-base">დამტენი</span>
                        </div>
                        <Button
                          variant="ghost"
                          className="text-primary hover:text-primary-dark hover:bg-primary/10 group-hover:translate-x-1 transition-transform"
                        >
                          რუკაზე ნახვა
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StationsPromo;
