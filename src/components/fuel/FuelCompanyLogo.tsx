const logos: Record<string, string> = {
  socar: '/fuel-company-logos/socar-logo.svg', gulf: '/fuel-company-logos/gulf-logo.png',
  wissol: '/fuel-company-logos/wissol-logo.png', rompetrol: '/fuel-company-logos/rompetrol-logo.png',
  portal: '/fuel-company-logos/portal-logo.svg', connect: '/fuel-company-logos/connect-main-logo.svg',
  lukoil: '/fuel-company-logos/lukoil-logo.png', neogas: 'https://priceshub.ge/images/nlogo.webp',
};
export default function FuelCompanyLogo({ name, className = 'w-10 h-10' }: { name: string; className?: string }) {
  const src = logos[name.trim().toLowerCase()];
  return src ? <img src={src} alt="" className={`${className} object-contain shrink-0 rounded bg-white`} loading="lazy" /> : <span className={`${className} rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0`} aria-hidden="true">{name.slice(0, 1)}</span>;
}
