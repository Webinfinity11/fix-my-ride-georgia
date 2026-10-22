import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  label: string;
  previousLabel: string;
  nextLabel: string;
  renderItem?: (item: string) => ReactNode;
  getHref?: (item: string) => string | undefined;
}

export default function HorizontalFilterChoices({ items, selected, onToggle, label, previousLabel, nextLabel, getHref, renderItem }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const active = useRef<HTMLElement | null>(null);
  const [canPrevious, setCanPrevious] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const key = items.join("|");
  const selectedKey = selected.join("|");
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const reveal = () => {
      const button = active.current;
      if (button && (button.offsetLeft < element.scrollLeft || button.offsetLeft + button.offsetWidth > element.scrollLeft + element.clientWidth)) {
        element.scrollLeft = Math.max(0, button.offsetLeft - 4);
      }
    };
    const update = () => {
      setCanPrevious(element.scrollLeft > 2);
      setCanNext(element.scrollLeft + element.clientWidth < element.scrollWidth - 2);
    };
    const observer = new ResizeObserver(() => { reveal(); update(); });
    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    reveal(); update();
    return () => { observer.disconnect(); element.removeEventListener("scroll", update); };
  }, [key, selectedKey]);
  const scroll = (direction: number) => {
    const element = track.current;
    element?.scrollBy({ left: direction * element.clientWidth * 0.75, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  return (
    <div className="relative w-full min-w-0" role="group" aria-label={label}>
      <div ref={track} className="relative flex gap-2 overflow-x-auto overscroll-x-contain rounded-lg p-1" style={{ scrollbarWidth: "thin" }}>
        {items.map(item => {
          const href = getHref?.(item);
          const selectedItem = selected.includes(item);
          const className = `inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${renderItem ? "w-16 px-1 " : "px-4 "}${selectedItem ? (renderItem ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-primary bg-primary text-primary-foreground") : "border-input bg-background hover:bg-accent hover:text-accent-foreground"}`;
          const ref = (node: HTMLElement | null) => { if (selected[selected.length - 1] === item) active.current = node; };
          return href ? <a key={item} ref={ref} href={href} rel={href.includes("?") ? "nofollow" : undefined} aria-current={selectedItem ? "true" : undefined} aria-label={item} title={item} className={className}>{renderItem ? renderItem(item) : item}</a>
            : <button key={item} ref={ref} type="button" aria-pressed={selectedItem} onClick={() => onToggle(item)} aria-label={item} title={item} className={className}>{renderItem ? renderItem(item) : item}</button>;
        })}
      </div>
      {canPrevious && <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center bg-gradient-to-r from-background via-background/95 to-transparent pr-5"><Button type="button" variant="outline" size="icon" aria-label={previousLabel} onClick={() => scroll(-1)} className="pointer-events-auto h-8 w-8 rounded-full shadow-sm"><ChevronLeft className="h-4 w-4" /></Button></div>}
      {canNext && <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center bg-gradient-to-l from-background via-background/95 to-transparent pl-5"><Button type="button" variant="outline" size="icon" aria-label={nextLabel} onClick={() => scroll(1)} className="pointer-events-auto h-8 w-8 rounded-full shadow-sm"><ChevronRight className="h-4 w-4" /></Button></div>}
    </div>
  );
}
