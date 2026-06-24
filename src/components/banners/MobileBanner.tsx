import { useState, useEffect } from "react";
import { X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveBanner } from "@/hooks/useSiteBanners";
import { useBannerTracking } from "@/hooks/useBannerAnalytics";

const MobileBanner = () => {
  const { data: banner } = useActiveBanner('home_above_mobile_nav');
  const [isVisible, setIsVisible] = useState(true);
  const { trackImpression, trackClick } = useBannerTracking(banner?.id);

  useEffect(() => {
    if (banner && isVisible) {
      trackImpression();
    }
  }, [banner, isVisible, trackImpression]);

  if (!banner || !isVisible) return null;

  const handleClick = () => {
    if (banner.link_url) {
      trackClick();
      window.open(banner.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed bottom-[70px] left-0 right-0 z-[9998] md:hidden bg-white border-t shadow-lg">
      <div className="relative">
        <div
          className={`relative ${banner.link_url ? 'cursor-pointer' : ''}`}
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
        <a
          href="tel:+995574047994"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold py-2 border-t hover:bg-primary-light transition-colors"
        >
          <Phone className="h-4 w-4" />
          დარეკვა: +995 574 04 79 94
        </a>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white"
          onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default MobileBanner;
