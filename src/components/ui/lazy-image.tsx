import { useState, useRef, useEffect, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  priority?: boolean;
  placeholderClassName?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const LazyImage = ({
  src,
  alt,
  className,
  priority = false,
  placeholderClassName,
  style,
  onError,
  width,
  height,
  ...props
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [priority]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Skeleton placeholder */}
      {!isLoaded && (
        <div
          className={cn(
            "absolute inset-0 animate-pulse rounded-md bg-muted",
            placeholderClassName
          )}
        />
      )}

      {/* Actual image */}
      {isInView && src && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          style={style}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            setIsLoaded(true);
            onError?.(e);
          }}
          {...props}
        />
      )}
    </div>
  );
};

export { LazyImage };
