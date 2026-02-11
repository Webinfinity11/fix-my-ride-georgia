import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveBanner } from "@/hooks/useSiteBanners";
import { useBannerTracking } from "@/hooks/useBannerAnalytics";

const HomeCenterBanner = () => {
  const { data: banner } = useActiveBanner('home_center_desktop');
  const [isVisible, setIsVisible] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const { trackImpression, trackClick } = useBannerTracking(banner?.id);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowBanner(true);
      } else {
        setShowBanner(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (banner && isVisible && showBanner) {
      trackImpression();
    }
  }, [banner, isVisible, showBanner, trackImpression]);

  if (!banner || !isVisible || !showBanner) return null;

  const handleClick = () => {
    if (banner.link_url) {
      trackClick();
      window.open(banner.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 z-[9997] animate-in slide-in-from-bottom-5 duration-300">
      <div className="relative max-w-[760px] group">
        <div
          className={`relative rounded-lg overflow-hidden shadow-lg ${banner.link_url ? 'cursor-pointer' : ''}`}
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
          onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default HomeCenterBanner;
