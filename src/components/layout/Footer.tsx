import FooterLinkSection from "@/components/layout/FooterLinkSection";
import { Link } from "react-router-dom";
import { Facebook, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { FooterTopCategories, FooterTopBrands, footerScrollListClass } from "@/components/seo/InternalLinkWidgets";
import { catalogueContainerClassName } from "@/components/services/catalogueLayout";

const quickLinks = [
  ["/mechanic", "ხელოსნების ძიება"], ["/services", "სერვისები"], ["/about", "ჩვენ შესახებ"],
  ["/contact", "კონტაქტი"], ["/blog", "ბლოგი"], ["/map", "რუკა"], ["/fuel-importers", "საწვავის ფასები"],
];
const accountLinks = [
  ["/register?type=mechanic", "ხელოსნის რეგისტრაცია"], ["/register?type=customer", "მომხმარებლის რეგისტრაცია"],
  ["/login", "შესვლა"], ["/dashboard", "პირადი კაბინეტი"],
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0c2943] text-white">
      <div className={catalogueContainerClassName}>
        <div className="grid gap-7 border-b border-white/10 py-8 md:grid-cols-[1.2fr_1fr] md:items-center md:gap-12 md:py-10">
          <div>
            <Link to="/" className="inline-flex items-center rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
              <img src="/assets/fixup-logo-6c6398d629fe8a15.webp" alt="FixUp Auto Service" width={163} height={80} className="h-12 w-auto object-contain" loading="lazy" />
            </Link>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-300">პლატფორმა, რომელიც აკავშირებს ავტომობილის ხელოსნებს და მომხმარებლებს. იპოვეთ საუკეთესო ხელოსანი თქვენი ავტომობილისთვის.</p>
          </div>
          <address className="grid gap-3 text-sm not-italic md:justify-self-end">
            <a href="tel:+995574047994" className="inline-flex items-center gap-3 rounded-lg text-lg font-semibold transition-colors hover:text-amber-300"><Phone className="h-4 w-4 text-amber-400" />+995 574 04 79 94</a>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-slate-300">
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" />თბილისი, საქართველო</span>
            </div>
          </address>
        </div>

        <nav aria-label="ფუტერის ნავიგაცია" className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-0 py-3 md:grid-cols-4 md:gap-8 md:py-10">
          <FooterLinkSection title="სწრაფი ბმულები">
            <ul className={footerScrollListClass}>{quickLinks.map(([to, text]) => <li key={to}><Link to={to}>{text}</Link></li>)}</ul>
          </FooterLinkSection>
          <FooterTopCategories limit={10} />
          <FooterTopBrands />
          <FooterLinkSection title="მომხმარებლები">
            <ul className={footerScrollListClass}>{accountLinks.map(([to, text]) => <li key={to}><Link to={to}>{text}</Link></li>)}</ul>
            <Link to="/register?type=mechanic" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2.5 text-xs font-medium transition-colors hover:border-amber-300 hover:text-amber-300">შემოუერთდით FixUp-ს<ArrowUpRight className="h-4 w-4 shrink-0" /></Link>
          </FooterLinkSection>
        </nav>

        <div className="flex flex-col gap-5 border-t border-white/10 py-6 pb-24 text-xs text-slate-400 md:flex-row md:items-center md:justify-between md:pb-6">
          <p>© {new Date().getFullYear()} FixUp. ყველა უფლება დაცულია.</p>
          <div className="flex items-center gap-2">
            <a href="https://www.facebook.com/FixupGeorgia" target="_blank" rel="noopener noreferrer" className="rounded-lg bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white" aria-label="Facebook-ის გვერდი"><Facebook className="h-4 w-4" /></a>
          </div>
          <a href="https://infinity.ge/services/saitis-damzadeba/" target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400" title="საიტის დამზადება — INFINITY">
            <span className="text-xs text-slate-300">საიტის დამზადება</span>
            <img src="/images/partners/infinity-card.png" alt="INFINITY solutions" width={1136} height={548} className="h-auto w-40 shrink-0 rounded-xl" loading="lazy" />
          </a>
        </div>
      </div>
    </footer>
  );
}
