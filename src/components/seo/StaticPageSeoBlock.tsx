import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, Lightbulb, HelpCircle, Wrench } from 'lucide-react';
import { RelatedBlogPosts } from '@/components/seo/InternalLinkWidgets';

/**
 * Generic SEO content block for static landing pages.
 * Mirrors the category-page treatment: long-form copy, highlights,
 * tips, FAQ with structured data, and a related-blog-posts widget.
 *
 * Drop this in below the page's main hero/form/list to give Google a
 * body to index without changing the page's existing UX.
 */

export type FAQItem = { q: string; a: string };

export type StaticPageSeoProps = {
  /** Section H2 title for the intro block, e.g. "ავტოდილერები საქართველოში" */
  introHeading: string;
  /** HTML allowed; uses prose styles. Aim for 200-400 words across paragraphs. */
  introHtml: string;
  /** 4-6 trust signal bullets. */
  highlights: string[];
  highlightsHeading?: string;
  /** 4-6 numbered choose-tips. */
  tips: string[];
  tipsHeading?: string;
  /** 4-8 FAQ items — also feeds FAQPage structured data. */
  faqItems: FAQItem[];
  faqHeading?: string;
  /** Topic name used in the FAQPage schema's `name` field. */
  topicName: string;
  /** Show the related-blog-posts widget after the FAQ (default true). */
  showRelatedBlogs?: boolean;
};

export function StaticPageSeoBlock({
  introHeading,
  introHtml,
  highlights,
  highlightsHeading,
  tips,
  tipsHeading,
  faqItems,
  faqHeading = 'ხშირად დასმული კითხვები',
  topicName,
  showRelatedBlogs = true,
}: StaticPageSeoProps) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: `${topicName} — ხშირად დასმული კითხვები`,
    mainEntity: faqItems.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };

  return (
    <>
      {/* Intro + highlights + tips */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">{introHeading}</h2>
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: introHtml }}
            />
          </div>

          {highlights.length > 0 && (
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
                <Wrench className="h-6 w-6 text-primary" />
                {highlightsHeading || `რას მოიცავს ${topicName} FixUp-ზე`}
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
          )}

          {tips.length > 0 && (
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-secondary" />
                {tipsHeading || `როგორ ავირჩიო საუკეთესო ${topicName}`}
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
          )}
        </div>
      </section>

      {/* FAQ */}
      {faqItems.length > 0 && (
        <section className="container mx-auto px-4 py-8 md:py-12 bg-muted/20">
          <Helmet>
            <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
          </Helmet>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              {faqHeading}
            </h2>
            <Accordion type="single" collapsible className="bg-background rounded-lg border">
              {faqItems.map((it, i) => (
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
      )}

      {/* Related blogs */}
      {showRelatedBlogs && (
        <div className="container mx-auto px-4">
          <RelatedBlogPosts limit={3} />
        </div>
      )}
    </>
  );
}
