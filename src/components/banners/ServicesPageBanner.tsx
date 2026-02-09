import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveBanner } from "@/hooks/useSiteBanners";

const ServicesPageBanner = () => {
  const { data: banner } = useActiveBanner('services_page');
  const [isVisible, setIsVisible] = useState(true);

  if (!banner || !isVisible) return null;

  const handleClick = () => {
    if (banner.link_url && banner.link_url !== '#') {
      window.open(banner.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {/* Desktop banner - fixed bottom center */}
      <div className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 z-[9997] animate-in slide-in-from-bottom-5 duration-300">
        <div className="relative max-w-[760px] group">
          <div
            className={`relative rounded-lg overflow-hidden shadow-lg ${banner.link_url && banner.link_url !== '#' ? 'cursor-pointer' : ''}`}
            onClick={handleClick}
          >
            <img
              src={banner.banner_url}
              alt="სარეკლამო ბანერი"
              className="w-[760px] h-[90px] object-cover"
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

      {/* Mobile banner - above bottom nav */}
      <div className="fixed bottom-[70px] left-0 right-0 z-[9998] md:hidden bg-white border-t shadow-lg">
        <div className="relative">
          <div
            className={`relative ${banner.link_url && banner.link_url !== '#' ? 'cursor-pointer' : ''}`}
            onClick={handleClick}
          >
            <img
              src={banner.banner_url}
              alt="სარეკლამო ბანერი"
              className="w-full h-auto"
              loading="lazy"
              style={{ maxHeight: '80px', objectFit: 'contain', backgroundColor: '#f3f4f6' }}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white"
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default ServicesPageBanner;
