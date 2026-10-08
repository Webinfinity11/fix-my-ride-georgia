import { ReactNode, useEffect, useRef, useState } from "react";

/** Mount expensive children once close to the viewport; preserve them on later scrolls. */
export function NearViewport({ children, fallback, className, rootMargin = "200px" }: {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setReady(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setReady(true);
        observer.disconnect();
      }
    }, { rootMargin });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [rootMargin]);

  return <div ref={ref} className={className}>{ready ? children : fallback}</div>;
}
