import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import cities from "@/data/cities.json";
import { growthDb } from "@/lib/growthDb";
import { formatNational, isMobile, nationalDigits } from "@/lib/vipPhone";

const ERRORS: Record<string, string> = {
  invalid_phone: "ჩაწერეთ მობილურის ნომერი.",
  invalid_problem: "აღწერეთ პრობლემა (მინიმუმ 5 სიმბოლო).",
  too_many_requests: "დღეს უკვე რამდენჯერმე გაგზავნეთ. სცადეთ ხვალ.",
};
const field = "mt-1 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring";

const DriverRequest = () => {
  const [problem, setProblem] = useState("");
  const [car, setCar] = useState("");
  const [city, setCity] = useState("თბილისი");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState({ sending: false, error: "", done: false });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (state.sending) return;
    if (!isMobile(phone)) { setState({ sending: false, done: false, error: ERRORS.invalid_phone }); return; }
    if (problem.trim().length < 5) { setState({ sending: false, done: false, error: ERRORS.invalid_problem }); return; }
    setState({ sending: true, error: "", done: false });
    const { error } = await growthDb.rpc("submit_driver_request", { p_phone: phone, p_city: city, p_problem: problem, p_car: car || null });
    if (error) {
      const known = Object.keys(ERRORS).find((key) => error.message.includes(key));
      setState({ sending: false, done: false, error: known ? ERRORS[known] : "ვერ გაიგზავნა. სცადეთ თავიდან ან დაგვირეკეთ: 574 04 79 94." });
      return;
    }
    setState({ sending: false, error: "", done: true });
  };

  return (
    <Layout>
      <SEOHead
        title="დატოვე განაცხადი — იპოვე ხელოსანი | Fixup.ge"
        description="აღწერეთ ავტომობილის პრობლემა და დატოვეთ ნომერი — ხელოსანი დაგიკავშირდებათ."
        canonical="https://fixup.ge/request"
        url="https://fixup.ge/request"
      />
      <div className="container mx-auto max-w-xl px-4 py-8">
        <h1 className="text-center text-3xl font-extrabold">დატოვე განაცხადი</h1>
        {state.done ? (
          <div role="status" className="mt-6 rounded-xl border bg-card p-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
            <h2 className="mt-3 text-xl font-semibold">განაცხადი მიღებულია</h2>
            <p className="mt-2 text-muted-foreground">ხელოსანი დაგიკავშირდებათ ნომერზე +995 {formatNational(phone)}.</p>
            <Button asChild variant="outline" className="mt-5"><Link to="/">მთავარ გვერდზე</Link></Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">რა პრობლემაა? *
              <textarea required rows={4} maxLength={500} value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="მაგ. მუხრუჭი ჭრიალებს" className={`${field} py-2`} />
            </label>
            <label className="block text-sm font-medium">მანქანა
              <Input maxLength={80} value={car} onChange={(e) => setCar(e.target.value)} placeholder="მაგ. Toyota Prius 2012" className="mt-1 h-11 text-base" />
            </label>
            <label className="block text-sm font-medium">ქალაქი
              <select value={city} onChange={(e) => setCity(e.target.value)} className={`${field} h-11`}>
                {cities.map((item) => <option key={item.slug} value={item.name}>{item.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">მობილურის ნომერი *
              <span className="mt-1 flex h-12 overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                <span className="flex items-center border-r bg-muted px-3 text-base font-semibold text-muted-foreground">+995</span>
                <input required type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="5XX XX XX XX" value={formatNational(phone)}
                  onChange={(e) => setPhone(nationalDigits(e.target.value))} className="min-w-0 flex-1 bg-transparent px-3 text-lg outline-none" />
              </span>
            </label>
            {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={state.sending}>
              {state.sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}გაგზავნა
            </Button>
            <p className="text-center text-xs text-muted-foreground">ნომერი და აღწერა გადაეცემა შერჩეულ ხელოსნებს.</p>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default DriverRequest;
