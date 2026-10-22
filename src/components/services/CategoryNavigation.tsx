import { cataloguePath } from "@/utils/catalogueNavigation";
import { locationCatalogueOptions } from "@/lib/locationCatalogue";
import { getCityByName, getCityBySlug } from "@/utils/locationCatalogue";
import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { getPublicServiceCategories, publicCategoriesKey } from "@/lib/serviceMetadata";
import { categoryNavigationSnapshot, sortCategoriesByDemand } from "@/lib/categoryNavigation";
import { createCategorySlug } from "@/utils/slugUtils";
import { getCategoryImage } from "@/utils/categoryImages";
import { Button } from "@/components/ui/button";

export default function CategoryNavigation({ selectedCategory = "all", selectedCity, selectedBrands = [] }: { selectedCategory?: number | "all"; selectedCity?: string | null; selectedBrands?: string[] }) {
  const { citySlug: routeCitySlug } = useParams();
  const citySlug = routeCitySlug || getCityByName(selectedCity)?.slug;
  const { data } = useQuery({ queryKey: [...publicCategoriesKey, "navigation"], queryFn: getPublicServiceCategories, staleTime: 60_000 });
  const { data: locationInventory } = useQuery({ ...locationCatalogueOptions, enabled: Boolean(citySlug) });
  const cityName = getCityBySlug(citySlug)?.name;
  const availableIds = new Set(locationInventory?.filter(row => row.city?.trim() === cityName).map(row => row.category_id));
  const categories = sortCategoriesByDemand(data?.length ? data : categoryNavigationSnapshot).filter(category => !citySlug || !locationInventory || availableIds.has(category.id));
  const track = useRef<HTMLDivElement>(null);
  const active = useRef<HTMLAnchorElement>(null);
  const [canPrevious, setCanPrevious] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const update = () => {
      setCanPrevious(element.scrollLeft > 2);
      setCanNext(element.scrollLeft + element.clientWidth < element.scrollWidth - 2);
    };
    // Keep the current category visible without moving the page vertically.
    const revealActive = () => { if (active.current) element.scrollLeft = Math.max(0, active.current.offsetLeft - 4); };
    revealActive();
    update();
    let width = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (width !== element.clientWidth) { width = element.clientWidth; revealActive(); }
      update();
    });
    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    return () => { observer.disconnect(); element.removeEventListener("scroll", update); };
  }, [selectedCategory, categories.length]);

  const scroll = (direction: number) => track.current?.scrollBy({ left: direction * track.current.clientWidth * 0.75, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  const cardClass = (selected: boolean) => `group flex w-24 shrink-0 flex-col overflow-hidden rounded-xl border bg-card text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-28 ${selected ? "border-primary ring-1 ring-primary text-primary" : "border-border hover:border-primary/50"}`;

  return (
    <section aria-label="სერვისის კატეგორიები" className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">აირჩიეთ კატეგორია</h2>
        <div className="flex gap-1">
          <Button type="button" variant="outline" size="icon" className="h-8 w-8" aria-label="წინა კატეგორიები" onClick={() => scroll(-1)} disabled={!canPrevious}><ChevronLeft className="h-4 w-4" /></Button>
          <Button type="button" variant="outline" size="icon" className="h-8 w-8" aria-label="შემდეგი კატეგორიები" onClick={() => scroll(1)} disabled={!canNext}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <nav aria-label="კატეგორიების არჩევა">
        <div ref={track} className="relative flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-3 pt-1 sm:gap-3" style={{ scrollbarWidth: "thin" }}>
          <a href={cataloguePath({ citySlug, brands: selectedBrands })} rel={citySlug && selectedBrands.length ? "nofollow" : undefined} ref={selectedCategory === "all" ? active : undefined} aria-current={selectedCategory === "all" ? "page" : undefined} className={cardClass(selectedCategory === "all")}>
            <span className="flex aspect-[4/3] items-center justify-center bg-primary/5"><LayoutGrid aria-hidden="true" className="h-8 w-8 text-primary" /></span>
            <span className="flex min-h-12 items-center justify-center px-1.5 py-2 text-[11px] font-semibold leading-tight">ყველა სერვისი</span>
          </a>
          {categories.map(category => (
            <a key={category.id} href={cataloguePath({ citySlug, categorySlug: createCategorySlug(category.name), brands: selectedBrands })} rel={selectedBrands.length ? "nofollow" : undefined} ref={selectedCategory === category.id ? active : undefined} aria-current={selectedCategory === category.id ? "page" : undefined} className={cardClass(selectedCategory === category.id)}>
              <img src={getCategoryImage(category.id)} alt="" width={112} height={84} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
              <span className="flex min-h-12 items-center justify-center px-1.5 py-2 text-[11px] font-semibold leading-tight">{category.name.trim()}</span>
            </a>
          ))}
        </div>
      </nav>
    </section>
  );
}
