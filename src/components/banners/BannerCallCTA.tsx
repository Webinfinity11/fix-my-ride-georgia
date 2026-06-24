import { Phone } from "lucide-react";

// "სარეკლამო ადგილი" placeholder with a clickable phone number beneath it.
const BannerCallCTA = () => (
  <div className="flex flex-col items-center justify-center h-full px-6 text-center leading-tight text-primary-foreground">
    <p className="text-lg font-bold">სარეკლამო ადგილი</p>
    <a
      href="tel:+995574047994"
      className="mt-1 inline-flex items-center gap-1.5 text-sm sm:text-base font-medium opacity-95 hover:opacity-100 transition-opacity"
    >
      <Phone className="h-4 w-4" />
      +995 574 04 79 94
    </a>
  </div>
);

export default BannerCallCTA;
