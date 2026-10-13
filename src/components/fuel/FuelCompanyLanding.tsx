import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import type { FuelImporter } from '@/hooks/useFuelImporters';
import type { CompanyName } from '@/services/fuelPricesApi';
import companies from '@/data/fuel-companies.json';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/seo/SEOHead';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';
import FuelCompanyPrices from './FuelCompanyPrices';
import FuelCompanyLinks from './FuelCompanyLinks';
import HorizontalScroll from './HorizontalScroll';
const FuelPriceHistory = lazy(() => import('./FuelPriceHistory'));

export default function FuelCompanyLanding({ company, importer, isLoading }: { company: typeof companies[number]; importer?: FuelImporter; isLoading: boolean }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const title = `${company.label} — საწვავის ფასები დღეს`;
  const path = `/fuel-prices/company/${company.slug}`;
  const products = importer?.fuelPrices ?? [];
  return <Layout>
    <SEOHead title={`${title} | FixUp`} description={`${company.label} (${company.name}) — ბენზინის, დიზელისა და სხვა ხელმისაწვდომი პროდუქტების ფასები, ტარიფები, მიღების დრო და ფასების ისტორია.`} canonical={`https://fixup.ge${path}`} noindex={!isLoading && !products.length} />
    <BreadcrumbSchema items={[{ name: 'მთავარი', url: 'https://fixup.ge/' }, { name: 'საწვავის ფასები', url: 'https://fixup.ge/fuel-importers' }, { name: company.label, url: `https://fixup.ge${path}` }]} />
    <div className="container mx-auto px-4 py-4 md:py-6">
      <Link to="/fuel-importers" className="text-xs text-primary underline">ყველა კომპანიის საწვავის ფასები</Link>
      <HorizontalScroll aria-label="გვერდის სათაური" className="mt-3"><h1 className="text-xl md:text-3xl font-bold whitespace-nowrap leading-8">{title}</h1></HorizontalScroll>
      <p className="text-xs text-muted-foreground mt-2">{company.name} · {products.length} პროდუქტი · წყაროში მითითებული ტარიფები</p>
      {isLoading && !products.length && <p className="mt-4" role="status">ფასები იტვირთება…</p>}
      {!isLoading && !products.length && <p className="mt-4">ფასები დროებით მიუწვდომელია.</p>}
      {importer && <FuelCompanyPrices importers={[importer]} />}
      <details className="mt-4 border rounded-xl bg-card p-4" onToggle={event => setHistoryOpen(event.currentTarget.open)}>
        <summary className="cursor-pointer font-semibold text-primary">{company.label} — ფასების ისტორია · მეტის ნახვა</summary>
        <p className="text-xs text-muted-foreground my-3">ისტორია აჩვენებს ხელმისაწვდომ დაკვირვებებს. ერთი ჩანაწერით ფასის ცვლილება ვერ განისაზღვრება; ცარიელი დღეებისთვის ფასი არ გამოითვლება.</p>
        {historyOpen && <Suspense fallback={<p role="status">ისტორია იტვირთება…</p>}><FuelPriceHistory initialCompany={company.slug as CompanyName} companyOnly /></Suspense>}
      </details>
      <details className="mt-4 border rounded-xl bg-card p-4" aria-label={`${company.label} — საწვავის ინფორმაცია`}>
        <summary className="cursor-pointer font-semibold text-primary">{company.label} — საწვავის შესახებ · მეტის ნახვა</summary>
        <div className="space-y-3 mt-3 text-sm text-muted-foreground">
          <h2 className="text-lg font-semibold text-foreground">{company.label}: ბენზინისა და დიზელის ფასების შედარება</h2>
          <p>{company.label} ({company.name}) საწვავის ფასები მოცემულია პროდუქტის სრული დასახელებით. ამ გვერდზე კომპანიის ყველა ხელმისაწვდომი პროდუქტი ერთადაა ჩამოთვლილი; სხვა კომპანიებთან შესადარებლად აირჩიეთ შესაბამისი საწვავის გვერდი.</p>
          <p>{company.label} საწვავის არჩევისას ფასთან ერთად გაითვალისწინეთ პროდუქტის კლასი და ავტომობილის მწარმოებლის მოთხოვნები. პროდუქტების მსგავსი დასახელება იდენტურ სპეციფიკაციას არ ნიშნავს. ბარათში მახასიათებელი მოცემულია მხოლოდ მაშინ, როცა წყარო მას უთითებს.</p>
          <h3 className="font-semibold text-foreground">სტანდარტული თუ თვითმომსახურება?</h3>
          <p>თვითმომსახურების გადამრთველი ხელმისაწვდომია მხოლოდ მაშინ, თუ წყარო {company.label}-სთვის ცალკე ტარიფს გვაწვდის. ასეთი მონაცემის არარსებობა არ ადასტურებს, რომ კომპანიას თვითმომსახურება საერთოდ არ აქვს. ფილიალში ხელმისაწვდომობა და პირობები გადაამოწმეთ სადგურთან.</p>
          <h3 className="font-semibold text-foreground">როდის განახლდა {company.label}-ს ფასები?</h3>
          <p>ბარათში მითითებული მიღების დრო მონაცემის ჩამოტვირთვის დროს ასახავს. ეს არ არის კომპანიის მიერ ფასის შეცვლის დადასტურებული დრო. მონაცემის წყარო ხელმისაწვდომია ბარათის ბმულით; კონკრეტული სადგურის მიმდინარე ფასი და ფასდაკლებები გადაამოწმეთ ადგილზე.</p>
          <div className="flex flex-wrap gap-3"><Link to="/fuel-prices/petrol" className="text-primary underline">ბენზინის ფასების შედარება</Link><Link to="/fuel-prices/diesel" className="text-primary underline">დიზელის ფასების შედარება</Link><Link to="/fuel-prices/self-service" className="text-primary underline">თვითმომსახურების ფასები</Link></div>
        </div>
      </details>
      <h2 className="text-lg font-semibold mt-6">სხვა კომპანიების ფასები</h2><FuelCompanyLinks />
    </div>
  </Layout>;
}
