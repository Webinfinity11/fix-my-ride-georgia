import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const ServiceDetailBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="w-full">
      <div 
        className="relative bg-primary rounded-xl shadow-lg overflow-hidden mx-auto"
        style={{ maxWidth: '730px', height: '90px' }}
      >
        {/* Content */}
        <div className="flex items-center justify-center h-full px-6">
          <div className="text-center text-primary-foreground">
            <p className="text-lg font-bold">სარეკლამო ადგილი</p>
            <p className="text-sm opacity-90">730 x 90 px</p>
          </div>
        </div>
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white/20 hover:bg-white/30 text-primary-foreground"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default ServiceDetailBanner;
