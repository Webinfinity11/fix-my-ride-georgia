import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Lightbulb, Wrench, ArrowRight, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { createSlug } from '@/utils/slugUtils';
import type { CategoryStats, FAQItem } from '@/utils/categoryContent';

/**
 * SEO content blocks for category landing pages:
 *   - <CategoryIntroSection> long-form body copy (H2/H3 + paragraphs)
 *   - <CategoryFAQSection> Q&A list + FAQPage structured data
 *   - <RelatedCategories> internal link grid to peer categories
 */

/* ─────────────────────────────────────────────────────────────────────── */

export function CategoryIntroSection({
  stats,
  introHtml,
  highlights,
  tips,
}: {
  stats: CategoryStats;
  introHtml: string;
  highlights: string[];
  tips: string[];
}) {
  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Intro */}
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: introHtml }}
        />

        {/* What's included */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            რას მოიცავს {stats.name} FixUp-ზე
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {highlights.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm md:text-base">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Choose tips */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-secondary" />
            როგორ ავირჩიო კარგი ხელოსანი {stats.name}-სთვის
          </h2>
          <ol className="space-y-3 list-none">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <span className="text-sm md:text-base">{tip}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

export function CategoryFAQSection({ items, categoryName }: { items: FAQItem[]; categoryName: string }) {
  if (!items || items.length === 0) return null;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: `${categoryName} — ხშირად დასმული კითხვები`,
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.a,
      },
    })),
  };

  return (
    <section className="container mx-auto px-4 py-8 md:py-12 bg-muted/20">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" />
          ხშირად დასმული კითხვები
        </h2>
        <Accordion type="single" collapsible className="bg-background rounded-lg border">
          {items.map((it, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="px-4 text-left hover:no-underline">
                <span className="font-medium text-base">{it.q}</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 text-muted-foreground leading-relaxed">
                {it.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

/** Show 6 other categories that have services — peer internal links. */
export function RelatedCategories({ currentId, limit = 6 }: { currentId: number; limit?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['related-categories', currentId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('id, name, icon, mechanic_services!inner(id)')
        .eq('mechanic_services.is_active', true);
      if (error) throw error;
      // Group + count + filter out current
      const counts = new Map<number, { id: number; name: string; icon: string | null; count: number }>();
      for (const row of (data || []) as Array<{ id: number; name: string; icon: string | null }>) {
        if (row.id === currentId) continue;
        const existing = counts.get(row.id);
        if (existing) existing.count += 1;
        else counts.set(row.id, { id: row.id, name: row.name, icon: row.icon ?? null, count: 1 });
      }
      return Array.from(counts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    },
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-8 md:py-12">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold">სხვა პოპულარული კატეგორიები</h2>
          <Link
            to="/category"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            ყველა <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {data.map((c) => (
            <Link key={c.id} to={`/category/${createSlug(c.name)}`}>
              <Card className="p-4 hover:shadow-md transition-shadow h-full flex flex-col">
                <h3 className="font-medium text-base mb-1 line-clamp-2">{c.name}</h3>
                <p className="text-xs text-muted-foreground mt-auto">
                  {c.count} სერვისი
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
