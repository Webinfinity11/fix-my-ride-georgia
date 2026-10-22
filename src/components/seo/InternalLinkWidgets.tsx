import FooterLinkSection from "@/components/layout/FooterLinkSection";
import { catalogueContainerClassName } from "@/components/services/catalogueLayout";
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LazyImage } from '@/components/ui/lazy-image';
import { ArrowRight, Calendar, Star, Wrench } from 'lucide-react';
import { BlogCard } from '@/components/blog/BlogCard';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { createSlug, createServiceSlug } from '@/utils/slugUtils';
import { BRAND_PAGES } from '@/utils/carBrands';
import { formatDate } from '@/utils/blogHelpers';
import type { BlogPost } from '@/hooks/useBlogPosts';

/**
 * Reusable internal-linking widgets for SEO. Each widget self-fetches its data,
 * caches via react-query, and degrades gracefully (returns null) when empty.
 *
 * Reasoning: thin sitewide internal-link layer beats heavy per-page custom logic.
 */

/* -------------------- Related Blog Posts (for service pages) -------------------- */

export function RelatedBlogPosts({ limit = 3 }: { limit?: number }) {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['related-blog-posts', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, content, featured_image, published_at, created_at, view_count, is_featured, author_id, updated_at, meta_title, meta_description, meta_keywords, status')
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) throw error;
      return data as BlogPost[];
    },
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) {
    return (
      <section className={`${catalogueContainerClassName} my-10 md:my-12`}>
        <h2 className="text-xl md:text-2xl font-bold mb-6">სასარგებლო სტატიები ბლოგიდან</h2>
        {/* Mobile: horizontal row (matches the carousel, no page stretch) */}
        <div className="flex md:hidden gap-3 overflow-hidden">
          {Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="h-72 basis-[85%] shrink-0" />
          ))}
        </div>
        {/* Desktop: 3-column grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (!posts || posts.length === 0) return null;

  return (
    <section className={`${catalogueContainerClassName} my-10 md:my-12`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-xl md:text-2xl font-bold">სასარგებლო სტატიები ბლოგიდან</h2>
        <Link
          to="/blog"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          ყველა სტატია <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {/* Mobile: swipeable carousel (keeps the section from stretching the page).
          The next card peeks at 85% width to signal swipeability. */}
      <Carousel opts={{ align: 'start', loop: false }} className="md:hidden">
        <CarouselContent className="-ml-3">
          {posts.map((p) => (
            <CarouselItem key={p.id} className="pl-3 basis-[85%] sm:basis-1/2">
              <BlogCard post={p} compact />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Desktop: unchanged 3-column grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        {posts.map((p) => (
          <BlogCard key={p.id} post={p} />
        ))}
      </div>
    </section>
  );
}

/* -------------------- Related Services (for blog post pages) -------------------- */

type LiteService = {
  id: number;
  name: string;
  slug: string | null;
  photos: string[] | null;
  rating: number | null;
  city: string | null;
};

export function RelatedServices({ limit = 6, excludeId }: { limit?: number; excludeId?: number }) {
  const { data: services, isLoading } = useQuery({
    queryKey: ['related-services', limit, excludeId],
    queryFn: async () => {
      // Prioritize VIP + high-rated services for internal link equity.
      const { data, error } = await supabase
        .from('mechanic_services')
        .select('id, name, slug, photos, rating, city, is_vip_active, vip_status')
        .eq('is_active', true)
        .order('is_vip_active', { ascending: false })
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(limit + (excludeId ? 1 : 0));
      if (error) throw error;
      const filtered = (data as (LiteService & { is_vip_active?: boolean; vip_status?: string })[])
        .filter((s) => s.id !== excludeId)
        .slice(0, limit);
      return filtered;
    },
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) {
    return (
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-6">პოპულარული სერვისები</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (!services || services.length === 0) return null;

  const serviceUrl = (s: LiteService) => {
    return `/service/${createServiceSlug(s.id, s.name)}`;
  };

  return (
    <section className="mt-12">
      <div className="flex items-end justify-between mb-6">
        <h2 className="text-2xl font-bold">პოპულარული სერვისები</h2>
        <Link
          to="/services"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          ყველა სერვისი <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {services.map((s) => {
          const photo = Array.isArray(s.photos)
            ? s.photos.find((p) => typeof p === 'string' && p.startsWith('http'))
            : null;
          return (
            <Link key={s.id} to={serviceUrl(s)}>
              <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                {photo ? (
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <LazyImage src={photo} alt={s.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-[4/3] flex items-center justify-center bg-muted">
                    <Wrench className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="p-3">
                  <h3 className="text-sm font-medium line-clamp-2 mb-1">{s.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {s.rating ? (
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-secondary text-secondary" />
                        {Number(s.rating).toFixed(1)}
                      </span>
                    ) : null}
                    {s.city && <span>· {s.city}</span>}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------- Footer Top Categories (sitewide internal links) ----------- */

// All footer destinations remain visible and crawlable at every viewport size.
export const footerScrollListClass =
  "space-y-2.5 text-xs leading-6 text-slate-300 md:text-sm [&_a]:inline-flex [&_a]:max-w-full [&_a]:items-start [&_a]:transition-colors [&_a:hover]:text-amber-300 [&_a]:rounded-sm [&_a:focus-visible]:outline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_svg]:hidden [&_span]:line-clamp-none [&_span]:whitespace-normal";

export function FooterTopCategories({ limit = 10 }: { limit?: number }) {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['footer-top-categories', limit],
    queryFn: async () => {
      // Use the count from joined services to rank categories by activity.
      const { data, error } = await supabase
        .from('service_categories')
        .select('id, name, mechanic_services!inner(id)')
        .eq('mechanic_services.is_active', true);
      if (error) throw error;
      // Group + count client-side (the join inflates rows).
      const counts = new Map<number, { id: number; name: string; count: number }>();
      for (const row of (data || []) as Array<{ id: number; name: string }>) {
        const existing = counts.get(row.id);
        if (existing) existing.count += 1;
        else counts.set(row.id, { id: row.id, name: row.name, count: 1 });
      }
      return Array.from(counts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    },
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading || !categories || categories.length === 0) {
    return null;
  }

  return (
    <FooterLinkSection title="პოპულარული კატეგორიები">
      <ul className={footerScrollListClass}>
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              to={`/category/${createSlug(c.name)}`}
              className="hover:text-amber-300"
            >
              <ArrowRight className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="line-clamp-1">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </FooterLinkSection>
  );
}

/**
 * Footer column linking the car-brand landing pages. Static list (the qualifying
 * brands from src/utils/carBrands.ts) so it needs no query — pure internal-link
 * equity toward the /brand cluster on every page that renders the footer.
 */
export function FooterTopBrands() {
  return (
    <FooterLinkSection title="მარკის მიხედვით">
      <ul className={footerScrollListClass}>
        <li>
          <Link to="/brand" className="font-medium hover:text-amber-300">
            <ArrowRight className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="line-clamp-1">ყველა მარკა</span>
          </Link>
        </li>
        {BRAND_PAGES.slice(0, 9).map((b) => (
          <li key={b.slug}>
            <Link
              to={`/brand/${b.slug}`}
              className="hover:text-amber-300"
            >
              <ArrowRight className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="line-clamp-1">{b.nameKa}</span>
            </Link>
          </li>
        ))}
      </ul>
    </FooterLinkSection>
  );
}

/* -------------------- Other Services from same Mechanic ------------------------- */

/**
 * Useful on ServiceDetail to keep visitors on the site browsing other services
 * by the same mechanic. Increases dwell time + internal page views.
 */
export function MechanicOtherServices({
  mechanicId,
  excludeServiceId,
  limit = 4,
}: {
  mechanicId: string;
  excludeServiceId: number;
  limit?: number;
}) {
  const { data: services, isLoading } = useQuery({
    queryKey: ['mechanic-other-services', mechanicId, excludeServiceId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mechanic_services')
        .select('id, name, slug, photos, rating, city')
        .eq('mechanic_id', mechanicId)
        .eq('is_active', true)
        .neq('id', excludeServiceId)
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) throw error;
      return data as LiteService[];
    },
    enabled: !!mechanicId,
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading || !services || services.length === 0) return null;

  const serviceUrl = (s: LiteService) => {
    return `/service/${createServiceSlug(s.id, s.name)}`;
  };

  const renderCard = (s: LiteService) => {
    const photo = Array.isArray(s.photos)
      ? s.photos.find((p) => typeof p === 'string' && p.startsWith('http'))
      : null;
    return (
      <Link to={serviceUrl(s)} className="block h-full">
        <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
          {photo ? (
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              <LazyImage src={photo} alt={s.name} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="aspect-[4/3] flex items-center justify-center bg-muted">
              <Wrench className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="p-3">
            <h3 className="text-sm font-medium line-clamp-2">{s.name}</h3>
            {s.rating ? (
              <div className="flex items-center gap-0.5 text-xs text-muted-foreground mt-1">
                <Star className="h-3 w-3 fill-secondary text-secondary" />
                {Number(s.rating).toFixed(1)}
              </div>
            ) : null}
          </div>
        </Card>
      </Link>
    );
  };

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6">ამ ხელოსნის სხვა სერვისები</h2>

      {/* Mobile: swipeable carousel (avoids a tall stacked grid). Two cards
          fit with the next one peeking at ~45% width. */}
      <Carousel opts={{ align: 'start', loop: false }} className="md:hidden">
        <CarouselContent className="-ml-3">
          {services.map((s) => (
            <CarouselItem key={s.id} className="pl-3 basis-[45%]">
              {renderCard(s)}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Desktop: unchanged 4-column grid */}
      <div className="hidden md:grid md:grid-cols-4 gap-4">
        {services.map((s) => (
          <div key={s.id}>{renderCard(s)}</div>
        ))}
      </div>
    </section>
  );
}
