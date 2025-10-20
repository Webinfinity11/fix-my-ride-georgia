import { Fuel } from "lucide-react";

const FuelHero = () => {
  return (
    <div className="relative bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground py-16 px-4 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="max-w-7xl mx-auto text-center relative z-10">
        <div className="flex justify-center mb-6 animate-fade-in">
          <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm">
            <Fuel className="w-16 h-16" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
          საწვავის იმპორტიორები საქართველოში
        </h1>
        
        <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto animate-fade-in">
          აირჩიეთ საუკეთესო ფასი თქვენი ავტომობილისთვის
        </p>
      </div>
    </div>
  );
};

export default FuelHero;
