import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { cityPattern } from "@/lib/cityNames";
import { growthDb } from "@/lib/growthDb";
import { isMobile, nationalDigits } from "@/lib/vipPhone";
import { useConfirm } from "./useConfirm";

const MAX = 10;
type Request = { id: number; phone: string; city: string; car: string | null; problem: string; status: "new" | "sent" | "closed"; created_at: string; driver_request_sends: { mechanic_id: string }[] };
type Provider = { id: string; name: string; phone: string; categories: string[] };
const STATUS = { new: "ახალი", sent: "გაგზავნილი", closed: "დახურული" };

async function findProviders(city: string): Promise<Provider[]> {
  const { data, error } = await supabase.from("mechanic_services")
    .select("mechanic_id, service_categories(name), profiles!fk_mechanic_services_profiles(first_name, last_name, phone)")
    .eq("is_active", true).filter("city", "imatch", cityPattern(city)).limit(1000);
  if (error) throw error;
  const found = new Map<string, Provider>();
  for (const row of data) {
    const profile = [row.profiles].flat()[0];
    const phone = nationalDigits(profile?.phone ?? "");
    if (!row.mechanic_id || !profile || !isMobile(phone)) continue;
    const provider = found.get(row.mechanic_id) ?? { id: row.mechanic_id, name: `${profile.first_name} ${profile.last_name}`.trim(), phone, categories: [] };
    const category = [row.service_categories].flat()[0]?.name;
    if (category && !provider.categories.includes(category)) provider.categories.push(category);
    found.set(row.mechanic_id, provider);
  }
  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name, "ka"));
}

const Forward = ({ request, onDone }: { request: Request; onDone: () => void }) => {
  const { confirm, dialog } = useConfirm();
  const [category, setCategory] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);
  const providers = useQuery({ queryKey: ["request-providers", request.city], queryFn: () => findProviders(request.city) });
  const already = new Set(request.driver_request_sends.map((send) => send.mechanic_id));
  const categories = [...new Set((providers.data ?? []).flatMap((p) => p.categories))].sort((a, b) => a.localeCompare(b, "ka"));
  const visible = (providers.data ?? []).filter((p) => !already.has(p.id) && (!category || p.categories.includes(category)));

  const send = useMutation({
    mutationFn: async () => {
      if (!await confirm(`გაეგზავნოს SMS ${chosen.length} ხელოსანს? SMS ფასიანია.`)) return null;
      const { data, error } = await supabase.functions.invoke("lead-sms", { body: { mode: "forward", requestId: request.id, mechanicIds: chosen } });
      if (error) throw error;
      return data as { sent: number; failed: number; unknown: number; skipped: number };
    },
    onSuccess: (result) => {
      if (!result) return;
      toast.success(`გაიგზავნა ${result.sent}, ვერ გაიგზავნა ${result.failed + result.unknown}, გამოტოვდა ${result.skipped}`);
      setChosen([]);
      onDone();
    },
    onError: (error: Error) => toast.error(`ვერ გაიგზავნა: ${error.message}`),
  });

  return (
    <div className="mt-3 rounded-lg border p-3">
      {dialog}
      <select aria-label="სფერო" value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-2 sm:w-72">
        <option value="">ყველა სფერო</option>
        {categories.map((name) => <option key={name} value={name}>{name}</option>)}
      </select>
      <ul className="mt-2 max-h-64 overflow-y-auto">
        {visible.map((provider) => (
          <li key={provider.id}>
            <label className="flex cursor-pointer items-center gap-2 py-1.5">
              <input type="checkbox" checked={chosen.includes(provider.id)} disabled={!chosen.includes(provider.id) && chosen.length >= MAX}
                onChange={(e) => setChosen(e.target.checked ? [...chosen, provider.id] : chosen.filter((id) => id !== provider.id))} />
              <span className="font-medium">{provider.name}</span>
              <span className="text-muted-foreground">{provider.phone} · {provider.categories.join(", ")}</span>
            </label>
          </li>
        ))}
      </ul>
      {providers.isSuccess && !visible.length && <p className="py-2 text-muted-foreground">ამ ქალაქში ხელოსანი ვერ მოიძებნა</p>}
      <Button className="mt-2" disabled={!chosen.length || send.isPending} onClick={() => send.mutate()}>SMS-ის გაგზავნა ({chosen.length}/{MAX})</Button>
    </div>
  );
};

const DriverRequests = () => {
  const client = useQueryClient();
  const [open, setOpen] = useState<number | null>(null);
  const requests = useQuery({
    queryKey: ["driver-requests"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await growthDb.from("driver_requests").select("*, driver_request_sends(mechanic_id)").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data as Request[];
    },
  });
  const refresh = () => client.invalidateQueries({ queryKey: ["driver-requests"] });
  const close = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await growthDb.from("driver_requests").update({ status: "closed" }).eq("id", id).select().single();
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (error: Error) => toast.error(`ვერ შესრულდა: ${error.message}`),
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">მძღოლების განაცხადები</CardTitle></CardHeader>
      <CardContent>
        {requests.isError ? (
          <p role="alert" className="text-sm text-red-600">ვერ ჩაიტვირთა. შეამოწმეთ, გაშვებულია თუ არა `growth` მიგრაცია.</p>
        ) : requests.isLoading ? (
          <p className="text-sm text-muted-foreground">იტვირთება…</p>
        ) : !requests.data?.length ? (
          <p className="py-4 text-center text-sm text-muted-foreground">განაცხადები ჯერ არ არის</p>
        ) : (
          <ul className="divide-y">
            {requests.data.map((request) => (
              <li key={request.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-muted-foreground">{new Date(request.created_at).toLocaleString("ka-GE", { dateStyle: "short", timeStyle: "short" })}</span>
                  <a href={`tel:+995${request.phone}`} className="font-semibold text-primary hover:underline">{request.phone}</a>
                  <span>{request.city}{request.car ? ` · ${request.car}` : ""}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{STATUS[request.status]}{request.driver_request_sends.length ? ` · ${request.driver_request_sends.length}` : ""}</span>
                </div>
                <p className="mt-1">{request.problem}</p>
                {request.status !== "closed" && (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setOpen(open === request.id ? null : request.id)}>ხელოსნებთან გაგზავნა</Button>
                    <Button size="sm" variant="ghost" onClick={() => close.mutate(request.id)}>დახურვა</Button>
                  </div>
                )}
                {open === request.id && <Forward request={request} onDone={refresh} />}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverRequests;
