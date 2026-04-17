import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const APP_STORE_URL =
  "https://apps.apple.com/ge/app/fixup-auto-services/id6757795136";
const DISMISS_KEY = "ios-app-promo-dismissed";
const SNOOZE_KEY = "ios-app-promo-snoozed-until";
const SNOOZE_DAYS = 7;

export function IOSAppPromo() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS) return;

    // Already in native/standalone app
    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore - Capacitor
      typeof (window as any).Capacitor !== "undefined";
    if (isStandalone) return;

    // Permanently dismissed
    if (localStorage.getItem(DISMISS_KEY) === "true") return;

    // Snoozed
    const snoozedUntil = localStorage.getItem(SNOOZE_KEY);
    if (snoozedUntil && Date.now() < parseInt(snoozedUntil, 10)) return;

    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismissForever = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setShow(false);
  };

  const handleSnooze = () => {
    const until = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(SNOOZE_KEY, String(until));
    setShow(false);
  };

  const handleOpenAppStore = () => {
    window.open(APP_STORE_URL, "_blank");
    handleSnooze();
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] animate-in fade-in duration-300"
        onClick={handleSnooze}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[9999]",
          "bg-card rounded-t-3xl shadow-2xl",
          "p-6 pb-8",
          "animate-in slide-in-from-bottom duration-300",
          "max-w-lg mx-auto"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ios-promo-title"
      >
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />

        {/* Close */}
        <button
          onClick={handleDismissForever}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
          aria-label="დახურვა"
        >
          <X className="h-5 w-5" />
        </button>

        {/* App icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg bg-primary/10 flex items-center justify-center">
            <img
              src="/icon-192.png"
              alt="FixUp"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/favicon.ico";
              }}
            />
          </div>
        </div>

        {/* Title */}
        <h2
          id="ios-promo-title"
          className="text-xl font-bold text-center mb-2"
        >
          FixUp — Auto Services
        </h2>

        {/* Rating row */}
        <div className="flex items-center justify-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className="h-4 w-4 fill-yellow-400 text-yellow-400"
            />
          ))}
          <span className="text-sm text-muted-foreground ml-2">
            ხელმისაწვდომია App Store-ზე
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
          სწრაფი წვდომა, push-შეტყობინებები და უკეთესი გამოცდილება — გადმოწერე
          ნატივი აპლიკაცია iPhone-ისთვის
        </p>

        {/* Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handleOpenAppStore}
            className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-semibold"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            App Store-ზე გადასვლა
          </Button>

          <Button
            onClick={handleSnooze}
            variant="ghost"
            className="w-full h-11 rounded-xl"
          >
            მოგვიანებით
          </Button>
        </div>
      </div>
    </>
  );
}
