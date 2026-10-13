import { load } from 'cheerio';

export const PRICE_SOURCE_URL = 'https://priceshub.ge/';
const COMPANIES: Record<string, string> = {
  socar: 'Socar', gulf: 'Gulf', wissol: 'Wissol', rompetrol: 'Rompetrol',
  portal: 'Portal', connect: 'Connect', lukoil: 'Lukoil', neogas: 'Neogas',
};
export interface SourceFuelPrice {
  fuelType: string;
  price: number;
  currency: string;
  selfServicePrice?: number;
  specifications?: string;
}
export interface SourceCompany {
  name: string;
  fuelPrices: SourceFuelPrice[];
  totalFuelTypes: number;
  timestamp: string;
  sourceUrl: string;
  source: string;
}
export interface SourcePayload {
  companies: SourceCompany[];
  fetchedAt: string;
  source: string;
  sourceUrl: string;
}
function price(value: string | undefined): number {
  const raw = (value ?? '').trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,3})?$/.test(raw)) throw new Error('Invalid PricesHub price');
  const result = Number(raw);
  if (result < 0.1 || result > 20) throw new Error('PricesHub price outside expected GEL/litre range');
  return result;
}

// Only the company tables: summary cards and the widget can have different
// refresh times. A broken/incomplete response must not replace the last cache.
export function parsePricesHub(markup: string, observedAt: string): SourcePayload {
  if (!Number.isFinite(Date.parse(observedAt))) throw new Error('Invalid observation time');
  const $ = load(markup);
  const companies: SourceCompany[] = [];
  for (const [id, name] of Object.entries(COMPANIES)) {
    const rows: SourceFuelPrice[] = [];
    $(`#company-card-${id} table tr`).each((_index, element) => {
      const cells = $(element).children('td');
      if (!cells.length) return;
      const cell = cells.eq(2);
      const fuelType = cells.eq(0).text().replace(/\s+/g, ' ').trim();
      if (cells.length !== 3 || !fuelType || !cell.hasClass('fuel-price-cell')) throw new Error(`Changed PricesHub table: ${id}`);
      const self = cell.attr('data-self')?.trim();
      const specification = cells.eq(1).text().trim();
      rows.push({ fuelType, price: price(cell.attr('data-std')), currency: 'GEL',
        ...(self ? { selfServicePrice: price(self) } : {}),
        ...(specification ? { specifications: specification } : {}),
      });
    });
    if (rows.length < 3 || new Set(rows.map(row => row.fuelType)).size !== rows.length) throw new Error(`Incomplete PricesHub company: ${id}`);
    companies.push({ name, fuelPrices: rows, totalFuelTypes: rows.length,
      timestamp: observedAt, sourceUrl: `${PRICE_SOURCE_URL}company/${id}`, source: 'priceshub',
    });
  }
  if (companies.reduce((count, company) => count + company.fuelPrices.length, 0) < 35) throw new Error('Incomplete PricesHub catalogue');
  // observedAt is our retrieval time, not an undocumented source change time.
  return { companies, fetchedAt: observedAt, source: 'priceshub', sourceUrl: PRICE_SOURCE_URL };
}

export async function fetchPricesHub(): Promise<SourcePayload> {
  const response = await fetch(PRICE_SOURCE_URL, {
    headers: { 'User-Agent': 'FixUpFuelBot/1.0 (+https://fixup.ge)', 'Accept': 'text/html' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error(`PricesHub HTTP ${response.status}`);
  const markup = await response.text();
  if (markup.length > 2_000_000) throw new Error('Unexpected PricesHub response size');
  return parsePricesHub(markup, new Date().toISOString());
}
