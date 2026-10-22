import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FooterLinkSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const update = () => setOpen(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return (
    <details open={open} onToggle={event => setOpen(event.currentTarget.open)} className="group min-w-0 border-b border-white/10 md:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden md:pointer-events-none md:mb-4 md:py-0">
        {title}<ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180 md:hidden" />
      </summary>
      <div className="pb-4 md:pb-0">{children}</div>
    </details>
  );
}
