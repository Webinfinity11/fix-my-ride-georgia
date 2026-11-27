import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Check, CheckCircle2, Crown, Loader2, Zap } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VipPrice, VipPromoNote } from "@/components/vip/VipPrice";
import { supabase } from "@/integrations/supabase/client";
import { formatNational, isMobile, nationalDigits } from "@/lib/vipPhone";
import type { VipPlan } from "@/lib/vipPricing";

const PLANS = [
  { id: "vip" as const, name: "VIP", icon: Crown, points: ["განცხადება სიაში ჩვეულებრივებზე ზემოთ ჩანს", "VIP ნიშანი განცხადებაზე"] },
  { id: "super_vip" as const, name: "Super VIP", icon: Zap, points: ["სიის სათავეში, VIP განცხადებებზეც ზემოთ", "Super VIP ნიშანი განცხადებაზე"] },
];

const ERRORS: Record<string, string> = {
  invalid_phone: "ჩაწერეთ მობილურის ნომერი, მაგალითად 555 12 34 56.",
  invalid_email: "ელფოსტა არასწორია. შეასწორეთ ან დატოვეთ ცარიელი.",
  too_many_requests: "მოთხოვნა უკვე ბევრჯერ გაიგზავნა. სცადეთ მოგვიანებით ან დაგვირეკეთ.",
};

// A complete number is sent by itself; this pause leaves time to fix a typo.
const AUTO_SEND_MS = 2000;

const Vip = () => {
  const [plan, setPlan] = useState<VipPlan>("vip");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [held, setHeld] = useState(false);
  const [state, setState] = useState<{ sending: boolean; error: string; price: number | null }>({ sending: false, error: "", price: null });

  const inFlight = useRef(false);
  const send = async () => {
    if (inFlight.current) return;
    if (!isMobile(phone)) {
      setState({ sending: false, price: null, error: ERRORS.invalid_phone });
      return;
    }
    inFlight.current = true;
    setState({ sending: true, error: "", price: null });
    const { data, error } = await supabase.rpc("submit_vip_lead", {
      p_plan: plan, p_phone: phone, p_email: email || undefined,
    });
    inFlight.current = false;
    if (error) {
      // No automatic retry: from here on the button decides.
      setHeld(true);
      const known = Object.keys(ERRORS).find((key) => error.message.includes(key));
      setState({ sending: false, price: null, error: known ? ERRORS[known] : "ვერ გაიგზავნა. სცადეთ თავიდან ან დაგვირეკეთ: 574 04 79 94." });
      return;
    }
    setState({ sending: false, error: "", price: data });
  };
  const sendRef = useRef(send);
  sendRef.current = send;

  const waiting = isMobile(phone) && !held && !state.sending && state.price === null;
  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => sendRef.current(), AUTO_SEND_MS);
    return () => clearTimeout(timer);
  }, [waiting, phone, plan]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    send();
  };

  return (
    <Layout>
      <SEOHead
        title="ავტო სერვისის რეკლამა — VIP და Super VIP | Fixup.ge"
        description="გამოაჩინეთ თქვენი ავტოსერვისის განცხადება სიის თავში. აირჩიეთ VIP ან Super VIP და დაგვიტოვეთ ნომერი."
        canonical="https://fixup.ge/vip"
        url="https://fixup.ge/vip"
      />
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold md:text-3xl">ავტო სერვისის რეკლამა</h1>
        <p className="mt-2 text-muted-foreground">აირჩიეთ პაკეტი, დაგვიტოვეთ ნომერი და ჩვენ დაგიკავშირდებით.</p>
        <VipPromoNote className="mt-4" />

        {state.price !== null ? (
          <div role="status" className="mt-6 rounded-xl border bg-card p-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
            <h2 className="mt-3 text-xl font-semibold">მოთხოვნა მიღებულია</h2>
            <p className="mt-2 text-muted-foreground">
              {plan === "vip" ? "VIP" : "Super VIP"} · {state.price} ₾. დაგიკავშირდებით ნომერზე +995 {formatNational(phone)}.
            </p>
            <Button asChild variant="outline" className="mt-5"><Link to="/">მთავარ გვერდზე</Link></Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-5">
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className="sr-only">აირჩიეთ პაკეტი</legend>
              {PLANS.map(({ id, name, icon: Icon, points }) => (
                <label key={id} className={`cursor-pointer rounded-xl border-2 p-4 transition-colors focus-within:ring-2 focus-within:ring-ring ${plan === id ? "border-primary bg-primary/5" : "border-border"}`}>
                  <input type="radio" name="plan" value={id} checked={plan === id} onChange={() => setPlan(id)} className="sr-only" />
                  <span className="flex items-center gap-2 text-lg font-semibold">
                    <Icon className={`h-5 w-5 ${id === "vip" ? "text-yellow-500" : "text-purple-500"}`} />{name}
                  </span>
                  <VipPrice plan={id} className="mt-3" />
                  <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    {points.map((point) => <li key={point} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />{point}</li>)}
                  </ul>
                </label>
              ))}
            </fieldset>

            <label className="block text-sm font-medium">
              მობილურის ნომერი *
              <span className="mt-1 flex h-12 overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                <span className="flex items-center border-r bg-muted px-3 text-base font-semibold text-muted-foreground">+995</span>
                <input className="min-w-0 flex-1 bg-transparent px-3 text-lg tracking-wide outline-none" type="tel" inputMode="numeric"
                  autoComplete="tel-national" required placeholder="5XX XX XX XX" value={formatNational(phone)}
                  onChange={(e) => { setPhone(nationalDigits(e.target.value)); setHeld(false); setState((x) => ({ ...x, error: "" })); }} />
              </span>
              <span className="mt-1 block text-xs font-normal text-muted-foreground">ნომრის ბოლომდე ჩაწერისთანავე მოთხოვნა თავად გაიგზავნება.</span>
            </label>
            {waiting && (
              <p role="status" className="flex items-center justify-between gap-3 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-900">
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />იგზავნება…</span>
                <button type="button" onClick={() => setHeld(true)} className="font-semibold underline">გაჩერება</button>
              </p>
            )}
            <label className="block text-sm font-medium">
              ელფოსტა (სურვილისამებრ)
              <Input className="mt-1 h-11 text-base" type="email" autoComplete="email" maxLength={200} value={email} onFocus={() => setHeld(true)} onChange={(e) => setEmail(e.target.value)} />
            </label>

            {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={state.sending}>
              {state.sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {plan === "vip" ? "VIP-ის მოთხოვნა" : "Super VIP-ის მოთხოვნა"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">გადახდა აქ არ ხდება. ნომერს მხოლოდ თქვენთან დასაკავშირებლად გამოვიყენებთ.</p>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default Vip;
