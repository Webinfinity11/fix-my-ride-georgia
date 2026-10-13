import { useState } from 'react';
import type { FuelImporter } from '@/hooks/useFuelImporters';

const logos: Record<string, string> = {
  socar: 'socar-logo.svg', gulf: 'gulf-logo.png', wissol: 'wissol-logo.png',
  rompetrol: 'rompetrol-logo.png', portal: 'portal-logo.svg',
  connect: 'connect-main-logo.svg', lukoil: 'lukoil-logo.png',
};

function CompanyCard({ company, initialSelfService }: { company: FuelImporter; initialSelfService: boolean }) {
  const [selfService, setSelfService] = useState(initialSelfService);
  const products = (company.fuelPrices ?? []).filter(fuel => Number.isFinite(fuel.price) && fuel.price > 0);
  const hasSelfService = products.some(fuel => typeof fuel.selfServicePrice === 'number' && fuel.selfServicePrice > 0);
  const shown = selfService ? products.filter(fuel => typeof fuel.selfServicePrice === 'number' && fuel.selfServicePrice > 0) : products;
  const logo = logos[company.name.toLowerCase()];
  return <article className="rounded-2xl border bg-card min-w-0 w-full overflow-hidden" aria-label={`${company.name} — პროდუქტების ფასები`}>
    <div className="flex items-center gap-3 px-4 py-4 border-b">
      {logo ? <img src={`/fuel-company-logos/${logo}`} alt="" className="w-10 h-10 object-contain" loading="lazy" /> : <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold" aria-hidden="true">{company.name.slice(0, 1)}</span>}
      <h3 className="font-semibold text-primary flex-1">{company.name}</h3>
      {company.sourceUrl?.startsWith('https://priceshub.ge/') && <a href={company.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground underline">წყარო</a>}
    </div>
    {hasSelfService && <div className="flex gap-1 p-2 bg-muted/40" role="group" aria-label={`${company.name} — ტარიფი`}>
      {[false, true].map(value => <button key={String(value)} type="button" aria-pressed={selfService === value} onClick={() => setSelfService(value)} className={`flex-1 inline-flex items-center justify-center gap-1 rounded-full border px-2 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${selfService === value ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background text-muted-foreground border-transparent hover:border-border'}`}> {selfService === value && <span aria-hidden="true">✓</span>}{value ? 'თვითმომსახურება' : 'სტანდარტული'}</button>)}
    </div>}
    <div className="px-3 py-3">
      <div className="grid grid-cols-[1fr_60px_64px] gap-2 px-2 pb-2 text-[10px] text-muted-foreground"><span>საწვავი</span><span className="text-center">მახასიათებელი</span><span className="text-right">ფასი, ₾</span></div>
      <ul>{shown.map((fuel, index) => <li key={`${fuel.fuelType}-${index}`} className="grid grid-cols-[1fr_60px_64px] gap-2 items-center px-2 py-3 odd:bg-muted/40 rounded-xl text-sm">
        <span className="font-medium">{fuel.fuelType}</span><span className="text-center text-xs text-muted-foreground">{fuel.specifications || '—'}</span><span className="text-right text-primary font-bold tabular-nums">{(selfService ? fuel.selfServicePrice! : fuel.price).toFixed(2)}</span>
      </li>)}</ul>
      {company.lastUpdated && Number.isFinite(Date.parse(company.lastUpdated)) && <p className="text-[10px] text-muted-foreground mt-3">მიღებულია: <time dateTime={company.lastUpdated}>{new Date(company.lastUpdated).toLocaleString('ka-GE', { timeZone: 'Asia/Tbilisi' })}</time></p>}
    </div>
  </article>;
}

export default function FuelCompanyPrices({ importers, initialSelfService = false }: { importers: FuelImporter[]; initialSelfService?: boolean }) {
  if (!importers.some(company => company.fuelPrices?.length)) return null;
  return <section className="mt-6" aria-label="კომპანიების ფასები">
    <h2 className="text-lg font-bold mb-1">ფასები კომპანიების მიხედვით</h2>
    <p className="text-xs text-muted-foreground mb-3">თითოეული კომპანიის ყველა პროდუქტი ერთ ბარათში.</p>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {importers.filter(company => company.fuelPrices?.length).map(company => <CompanyCard key={company.name} company={company} initialSelfService={initialSelfService} />)}
    </div>
  </section>;
}
