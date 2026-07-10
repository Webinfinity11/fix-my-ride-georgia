import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Car } from 'lucide-react';
import { BRAND_PAGES } from '@/utils/carBrands';
import { CAR_BRAND_LOGOS } from '@/data/carBrandLogos';

/**
 * Internal-link grid to the brand landing pages. Turns each brand page into a
 * crawlable cluster and gives users a fast brand switcher. Excludes the current
 * brand when rendered on a brand page.
 */
export function BrandsNav({ currentSlug, heading = 'ავტოსერვისი მარკის მიხედვით' }: {
  currentSlug?: string;
  heading?: string;
}) {
  const brands = BRAND_PAGES.filter((b) => b.slug !== currentSlug);
  if (brands.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
          <Car className="h-6 w-6 text-primary" />
          {heading}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {brands.map((b) => {
            const logo = CAR_BRAND_LOGOS[b.name];
            return (
              <Link key={b.slug} to={`/brand/${b.slug}`} className="block">
                <Card className="p-3 hover:shadow-md transition-shadow hover:border-primary flex items-center gap-3">
                  {logo ? (
                    <img
                      src={logo}
                      alt={`${b.nameKa} ლოგო`}
                      loading="lazy"
                      className="h-8 w-8 object-contain flex-shrink-0"
                    />
                  ) : (
                    <span className="h-8 w-8 flex-shrink-0 grid place-items-center rounded bg-muted">
                      <Car className="h-4 w-4 text-muted-foreground" />
                    </span>
                  )}
                  <span className="font-medium text-sm md:text-base line-clamp-1">{b.nameKa}</span>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
