import { Phone } from "lucide-react";

// Fills a banner slot with a direct call-to-action for the platform phone number.
const BannerCallCTA = () => (
  <a
    href="tel:+995574047994"
    className="flex items-center justify-center gap-3 h-full px-6 text-primary-foreground hover:opacity-90 transition-opacity"
  >
    <Phone className="h-6 w-6 shrink-0" />
    <div className="text-center leading-tight">
      <p className="text-base sm:text-lg font-bold">დაგვირეკეთ: +995 574 04 79 94</p>
      <p className="text-xs sm:text-sm opacity-90">გჭირდებათ დახმარება? ჩვენ დაგეხმარებით</p>
    </div>
  </a>
);

export default BannerCallCTA;
