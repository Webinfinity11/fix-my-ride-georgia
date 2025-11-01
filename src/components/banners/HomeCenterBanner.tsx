import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveBanner } from "@/hooks/useSiteBanners";

const HomeCenterBanner = () => {
  const { data: banner } = useActiveBanner('home_center_desktop');
  const [isVisible, setIsVisible] = useState(true);

  if (!banner || !isVisible) return null;

  const handleClick = () => {
    if (banner.link_url) {
      window.open(banner.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 hidden md:block">
      <div className="relative max-w-[760px] mx-auto group">
        <div 
          className={`relative rounded-lg overflow-hidden shadow-md ${banner.link_url ? 'cursor-pointer' : ''}`}
          onClick={handleClick}
        >
          <img 
            src={banner.banner_url} 
            alt="სარეკლამო ბანერი"
            className="w-full h-[90px] object-cover"
            loading="lazy"
            style={{ minHeight: '90px', backgroundColor: '#f3f4f6' }}
          />
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default HomeCenterBanner;
