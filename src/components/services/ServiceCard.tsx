// src/components/ServiceGallery.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import clsx from "clsx";

interface ServiceGalleryProps {
  photos: string[];
  serviceName?: string;
  autoPlay?: boolean;
  interval?: number; // ms
  className?: string;
}

export default function ServiceGallery({
  photos,
  serviceName,
  autoPlay = true,
  interval = 4000,
  className,
}: ServiceGalleryProps) {
  const cleaned = useMemo(
    () => (Array.isArray(photos) ? photos.filter(Boolean) : []),
    [photos]
  );

  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<Record<number, boolean>>({});
  const timerRef = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Auto-play
  useEffect(() => {
    if (!autoPlay || cleaned.length <= 1) return;
    timerRef.current = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % cleaned.length);
    }, interval);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [autoPlay, interval, cleaned.length]);

  // Preload next image for smoothness
  useEffect(() => {
    if (cleaned.length <= 1) return;
    const next = (index + 1) % cleaned.length;
    const img = new Image();
    img.src = cleaned[next];
  }, [index, cleaned]);

  const goPrev = () => setIndex((prev) => (prev - 1 + cleaned.length) % cleaned.length);
  const goNext = () => setIndex((prev) => (prev + 1) % cleaned.length);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      delta > 0 ? goPrev() : goNext();
    }
    touchStartX.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goPrev();
    if (e.key === "ArrowRight") goNext();
  };

  const currentSrc = cleaned[index];

  return (
    <div
      className={clsx(
        "relative group select-none",
        "bg-gradient-to-br from-primary/5 to-primary/10",
        "border-b border-primary/10",
        className
      )}
      role="region"
      aria-label={serviceName ? `${serviceName} gallery` : "Service gallery"}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Main area (4:3) */}
      <div className="aspect-[4/3] w-full overflow-hidden">
        {/* Skeleton while loading */}
        {!loaded[index] && !error[index] && (
          <div className="absolute inset-0 animate-pulse bg-gray-200/60" />
        )}

        {/* Error fallback */}
        {error[index] && (
          <div className="absolute inset-0 flex items-center justify-center text-primary/40">
            <div className="flex flex-col items-center">
              <ImageOff className="w-10 h-10 mb-2" />
              <span className="text-xs">ვერ ჩაიტვირთა ფოტო</span>
            </div>
          </div>
        )}

        {/* Image */}
        {currentSrc && !error[index] && (
          <img
            src={currentSrc}
            alt={serviceName ? `${serviceName} photo ${index + 1}` : `photo ${index + 1}`}
            className={clsx(
              "h-full w-full object-cover transition-opacity duration-300",
              loaded[index] ? "opacity-100" : "opacity-0"
            )}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded((s) => ({ ...s, [index]: true }))}
            onError={() => setError((s) => ({ ...s, [index]: true }))}
            draggable={false}
          />
        )}
      </div>

      {/* Arrows (shown if >1 image) */}
      {cleaned.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className={clsx(
              "absolute left-2 top-1/2 -translate-y-1/2 z-10",
              "rounded-full bg-white/80 backdrop-blur px-2.5 py-2 shadow-sm",
              "opacity-0 group-hover:opacity-100 transition-opacity"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className={clsx(
              "absolute right-2 top-1/2 -translate-y-1/2 z-10",
              "rounded-full bg-white/80 backdrop-blur px-2.5 py-2 shadow-sm",
              "opacity-0 group-hover:opacity-100 transition-opacity"
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots (no thumbnails) */}
      {cleaned.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {cleaned.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to image ${i + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
              className={clsx(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-4 bg-white shadow" : "w-2 bg-white/60 hover:bg-white"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
