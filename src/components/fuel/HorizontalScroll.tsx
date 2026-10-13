import { useEffect, useRef, useState, type HTMLAttributes } from 'react';

/** Edge fades and a scroll action appear only while more content is available. */
export default function HorizontalScroll({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => setEdges({ left: node.scrollLeft > 2, right: node.scrollWidth - node.clientWidth - node.scrollLeft > 2 });
    update();
    node.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(node);
    for (const child of node.children) observer.observe(child);
    return () => { node.removeEventListener('scroll', update); observer.disconnect(); };
  }, [children]);
  const mask = `linear-gradient(to right, ${edges.left ? 'transparent, black 24px' : 'black'}, ${edges.right ? 'black calc(100% - 30px), transparent' : 'black'})`;
  return <div className="relative min-w-0">
    <div {...props} ref={ref} tabIndex={props.tabIndex ?? 0} className={`overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`} style={{ ...props.style, maskImage: mask, WebkitMaskImage: mask }}>{children}</div>
    {edges.right && <button type="button" aria-label="გადაასქროლეთ მარჯვნივ" onClick={() => ref.current?.scrollBy({ left: ref.current.clientWidth * 0.7, behavior: 'smooth' })} className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-background/95 text-primary border shadow-sm h-5 w-5 flex items-center justify-center text-sm focus-visible:ring-2 focus-visible:ring-primary">›</button>}
  </div>;
}
