import { Fuel } from "lucide-react";
import { useFuelPageSettings } from "@/hooks/useFuelImporters";

const FuelHero = () => {
  const { data: pageSettings } = useFuelPageSettings();
  
  return (
    <div className="relative bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 py-12 md:py-16 px-4 md:px-8 overflow-hidden">
      {pageSettings?.banner_url && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${pageSettings.banner_url})` }}
          />
          <div className="absolute inset-0 bg-white/60"></div>
        </>
      )}
      
      {!pageSettings?.banner_url && (
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 right-40 w-40 h-40 bg-blue-300/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-10 w-24 h-24 bg-blue-100/40 rounded-full blur-xl"></div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left column - Text content */}
          <div className="text-left animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              საწვავის იმპორტიორები საქართველოში
            </h1>
            
            <p className="text-lg md:text-xl text-gray-700 max-w-xl">
              აირჩიეთ საუკეთესო ფასი თქვენი ავტომობილისთვის
            </p>
          </div>
          
          {/* Right column - Visual elements */}
          <div className="flex justify-center md:justify-end animate-fade-in">
            <div className="relative">
              <div className="p-6 bg-orange-500 rounded-full shadow-lg">
                <Fuel className="w-20 h-20 md:w-24 md:h-24 text-white" />
              </div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-200/50 rounded-full blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-blue-300/40 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuelHero;
