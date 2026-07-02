import { Phone, X, Copy, BadgePercent } from "lucide-react";
import { toast } from "sonner";

// Group a Georgian mobile number for readability: 577611515 → +995 577 61 15 15
const formatPhone = (raw: string) => {
  if (!raw) return raw;
  const digits = raw.replace(/\D/g, "");
  let cc = "";
  let local = digits;
  if (digits.length === 12 && digits.startsWith("995")) { cc = "+995 "; local = digits.slice(3); }
  else if (digits.length === 10 && digits.startsWith("0")) { local = digits.slice(1); }
  if (local.length === 9) {
    return `${cc}${local.slice(0, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7, 9)}`;
  }
  return raw;
};

interface PhoneRevealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  city?: string | null;
  phone: string;
}

/**
 * Shared phone-reveal popup — the same contact card used on the service detail
 * page and the service cards. Large, readable number + "mention FixUp" nudge.
 */
export const PhoneRevealDialog = ({ open, onOpenChange, name, city, phone }: PhoneRevealDialogProps) => {
  if (!open) return null;

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" onClick={() => onOpenChange(false)}>
      <div className="absolute inset-0 bg-ink-950/55 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white shadow-float overflow-hidden border border-ink-200/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-11 w-11 rounded-xl bg-brand-500 text-white grid place-items-center text-[14px] font-bold tracking-wider shrink-0">{initials || "?"}</div>
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-ink-900 truncate">{name}</div>
              <div className="text-[11.5px] text-ink-500">ხელოსანი{city ? ` · ${city}` : ""}</div>
            </div>
            <button type="button" onClick={() => onOpenChange(false)} className="ml-auto h-8 w-8 rounded-btn hover:bg-ink-100 grid place-items-center"><X className="h-4 w-4" /></button>
          </div>

          <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-success-700 mb-1.5 inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-success-500" />გახსნილი ნომერი</div>
          <a href={`tel:${phone}`} className="block rounded-xl bg-ink-50 border border-ink-200/60 px-4 py-4 text-center hover:border-brand-500 transition">
            <span className="block text-[28px] md:text-[32px] font-extrabold text-ink-900 font-mono tabular-nums tracking-tight leading-none">{formatPhone(phone)}</span>
          </a>
          <button type="button" onClick={() => { navigator.clipboard?.writeText(phone); toast.success("ნომერი დაკოპირდა"); }} className="mt-2 w-full h-9 rounded-btn bg-white border border-ink-200 hover:border-ink-900 inline-flex items-center justify-center gap-1.5 text-ink-700 text-[12px] font-semibold"><Copy className="h-3.5 w-3.5" />ნომრის კოპირება</button>

          <div className="mt-3 rounded-xl bg-accent-50 border border-accent-200 p-3 flex items-center gap-3">
            <span className="h-10 w-10 rounded-lg bg-accent-500 text-white grid place-items-center shrink-0"><BadgePercent className="h-5 w-5" /></span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-ink-700">ფასდაკლებისთვის ახსენეთ</div>
              <div className="mt-1">
                <span className="inline-flex items-center px-3 h-8 rounded-pill bg-brand-500 text-white text-[15px] font-extrabold tracking-wider animate-phone-glow">
                  FIXUP&nbsp;GE
                </span>
              </div>
            </div>
          </div>

          <a href={`tel:${phone}`} className="mt-3 w-full h-11 rounded-pill bg-brand-500 hover:bg-brand-600 text-white text-[13px] font-bold inline-flex items-center justify-center gap-2"><Phone className="h-4 w-4" />დარეკვა ახლავე</a>
          <p className="mt-2.5 text-[10.5px] text-ink-500 text-center">დარეკვის ღილაკი გაუშვებს სატელეფონო აპლიკაციას</p>
        </div>
      </div>
    </div>
  );
};

export default PhoneRevealDialog;
