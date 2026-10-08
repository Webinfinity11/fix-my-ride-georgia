import { useEffect, useState } from 'react';

// Promotional overlays should not cover the content on the first screen.
export function usePastFirstScreen() {
  const [pastFirstScreen, setPastFirstScreen] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY < window.innerHeight) return;
      setPastFirstScreen(true);
      window.removeEventListener('scroll', onScroll);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return pastFirstScreen;
}
