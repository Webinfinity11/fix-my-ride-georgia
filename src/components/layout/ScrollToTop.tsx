import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const positions = new Map<string, { x: number; y: number }>();

export default function ScrollToTop() {
  const location = useLocation();
  const navigation = useNavigationType();
  useLayoutEffect(() => {
    const previousMode = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    const saved = navigation === 'POP' ? positions.get(location.key) : undefined;
    let restoring = true;
    let frame = 0;
    const restore = () => {
      if (!restoring) return;
      window.scrollTo({ left: saved?.x ?? 0, top: saved?.y ?? 0, behavior: 'instant' });
    };
    // Lazy routes, cached cards and images can finish layout after the route commit.
    const observer = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(restore); });
    observer.observe(document.body);
    frame = requestAnimationFrame(() => { restore(); frame = requestAnimationFrame(restore); });
    const stop = () => { restoring = false; observer.disconnect(); };
    const timeout = window.setTimeout(stop, 5000);
    const record = () => {
      if (!restoring) positions.set(location.key, { x: window.scrollX, y: window.scrollY });
    };
    const interact = () => { stop(); record(); };
    window.addEventListener('scroll', record, { passive: true });
    window.addEventListener('wheel', interact, { passive: true });
    window.addEventListener('touchstart', interact, { passive: true });
    window.addEventListener('pointerdown', interact, { passive: true });
    window.addEventListener('keydown', interact);
    return () => {
      // Read before the next restoration; don't replace a saved POP offset with a loading layout.
      observer.disconnect(); cancelAnimationFrame(frame); clearTimeout(timeout);
      window.removeEventListener('scroll', record);
      window.removeEventListener('wheel', interact);
      window.removeEventListener('touchstart', interact);
      window.removeEventListener('pointerdown', interact);
      window.removeEventListener('keydown', interact);
      history.scrollRestoration = previousMode;
    };
  }, [location.key, navigation]);
  return null;
}
