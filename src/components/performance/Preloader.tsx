import { useEffect } from 'react';

interface PreloaderProps {
  resources: string[];
  fonts?: string[];
  critical?: boolean;
}

export const Preloader = ({ resources, fonts = [], critical = false }: PreloaderProps) => {
  useEffect(() => {
    // Preload critical resources
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = critical ? 'preload' : 'prefetch';
      link.href = resource;
      
      // Determine resource type
      if (resource.match(/\.(css)$/)) {
        link.as = 'style';
      } else if (resource.match(/\.(js|ts)$/)) {
        link.as = 'script';
      } else if (resource.match(/\.(jpg|jpeg|png|webp|svg)$/)) {
        link.as = 'image';
      } else if (resource.match(/\.(woff|woff2|ttf|otf)$/)) {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
    });

    // Preload fonts
    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font;
      link.as = 'font';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Add dns-prefetch for external domains
    const externalDomains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'kwozniwtygkdoagjegom.supabase.co'
    ];

    externalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `https://${domain}`;
      document.head.appendChild(link);
    });

  }, [resources, fonts, critical]);

  return null;
};