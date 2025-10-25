import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const opacity = Math.min(pullDistance / threshold, 1);

  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm border-b transition-all duration-200"
      style={{
        height: `${Math.min(pullDistance, 60)}px`,
        opacity: opacity,
      }}
    >
      <div className="flex flex-col items-center gap-1">
        {isRefreshing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">განახლება...</span>
          </>
        ) : (
          <>
            <ArrowDown
              className={cn(
                "h-5 w-5 text-primary transition-transform duration-200",
                progress >= 100 && "rotate-180"
              )}
            />
            <span className="text-xs text-muted-foreground">
              {progress >= 100 ? 'გაუშვი განახლებისთვის' : 'ჩამოწიე განახლებისთვის'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
