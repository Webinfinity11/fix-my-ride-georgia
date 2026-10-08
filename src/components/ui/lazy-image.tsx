import { useState, useRef, useEffect, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  priority?: boolean;
  fallbackSrc?: string;
  placeholderClassName?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const LoadedImage = ({ src, fallbackSrc, priority, className, placeholderClassName, onLoad, onError, srcSet, ...props }: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  return (
    <>
      {!isLoaded && !priority && <div className={cn("absolute inset-0 animate-pulse rounded-md bg-muted", placeholderClassName)} />}
      <img
        {...props}
        src={useFallback ? fallbackSrc : src}
        srcSet={useFallback ? undefined : srcSet}
        className={cn("transition-opacity duration-300", priority || isLoaded ? "opacity-100" : "opacity-0", className)}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...({ fetchpriority: priority ? "high" : "auto" } as Record<string, string>)}
        onLoad={(event) => { setIsLoaded(true); onLoad?.(event); }}
        onError={(event) => {
          if (!useFallback && fallbackSrc && fallbackSrc !== src) {
            setUseFallback(true);
            setIsLoaded(false);
          } else {
            setIsLoaded(true);
            onError?.(event);
          }
        }}
      />
    </>
  );
};

const LazyImage = ({ priority = false, ...props }: LazyImageProps) => {
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || !containerRef.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, { rootMargin: "200px" });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [priority]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {(priority || isInView) && props.src ? (
        // A new source must start a fresh loading/fallback lifecycle.
        <LoadedImage key={`${props.src}|${props.srcSet || ""}`} {...props} priority={priority} />
      ) : (
        <div className={cn("absolute inset-0 animate-pulse rounded-md bg-muted", props.placeholderClassName)} />
      )}
    </div>
  );
};

export { LazyImage };
