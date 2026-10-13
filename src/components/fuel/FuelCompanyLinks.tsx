import { Link } from 'react-router-dom';
import companies from '@/data/fuel-companies.json';
import FuelCompanyLogo from './FuelCompanyLogo';
export default function FuelCompanyLinks() {
  return <nav aria-label="კომპანიების საწვავის ფასები" className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4">
    {companies.map(company => <Link key={company.slug} to={`/fuel-prices/company/${company.slug}`} className="flex items-center gap-2 min-w-0 rounded-xl border bg-card p-3 text-sm text-primary hover:bg-muted"><FuelCompanyLogo name={company.name} className="w-7 h-7" /><span>{company.label} — ფასები</span></Link>)}
  </nav>;
}
