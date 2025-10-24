import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user has dismissed the banner before
      const hasDismissed = localStorage.getItem('pwa-install-dismissed');
      if (!hasDismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (isInstalled || !showInstallBanner) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm",
        "bg-card border rounded-lg shadow-lg p-4 z-[9997]",
        "animate-in slide-in-from-bottom-5 duration-300"
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        aria-label="დახურვა"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Download className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">დააინსტალირე FixUp</h3>
          <p className="text-xs text-muted-foreground mb-3">
            დააინსტალირე აპლიკაცია სწრაფი წვდომისთვის
          </p>
          
          <Button
            onClick={handleInstallClick}
            size="sm"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            ინსტალაცია
          </Button>
        </div>
      </div>
    </div>
  );
}
