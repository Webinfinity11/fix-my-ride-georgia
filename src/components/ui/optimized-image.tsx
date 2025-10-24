import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
}

export function OptimizedImage({
  src,
  alt,
  className,
  fallback = '/placeholder.svg',
  fetchPriority = 'auto',
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
              img.src = dataSrc;
              img.removeAttribute('data-src');
            }
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px',
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  // For high priority images, load immediately without lazy loading
  const shouldLazyLoad = fetchPriority !== 'high';

  return (
    <img
      ref={imgRef}
      data-src={shouldLazyLoad ? src : undefined}
      src={shouldLazyLoad ? fallback : src}
      alt={alt}
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
        error && 'opacity-50',
        className
      )}
      loading={shouldLazyLoad ? 'lazy' : 'eager'}
      fetchPriority={fetchPriority}
      onLoad={() => setIsLoaded(true)}
      onError={() => setError(true)}
      {...props}
    />
  );
}
