import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { listingId, mechanicQuery } from "@/lib/vipSearch";
import type { VipPlan } from "@/lib/vipPricing";
import { useConfirm } from "./useConfirm";

const COLUMNS = "id, name, city, mechanic_id, vip_status, vip_until, is_vip_active";
const DURATIONS = [7, 30, 90];

type Service = {
  id: number; name: string; city: string | null; mechanic_id: string;
  vip_status: VipPlan | null; vip_until: string | null; is_vip_active: boolean | null;
};
type Mechanic = { id: string; first_name: string; last_name: string; phone: string | null };

const planName = (plan: VipPlan) => (plan === "vip" ? "VIP" : "Super VIP");

function useDebounced(value: string) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), 350);
    return () => clearTimeout(timer);
  }, [value]);
  return debounced.trim();
}

async function findServices(term: string): Promise<Service[]> {
  const id = listingId(term);
  const query = supabase.from("mechanic_services").select(COLUMNS).eq("is_active", true);
  const { data, error } = await (id
    ? query.eq("id", id)
    : query.ilike("name", `%${term.replace(/[\\%_]/g, "\\$&")}%`).order("name").limit(30));
  if (error) throw error;
  return data as Service[];
}

async function findMechanics(term: string): Promise<Mechanic[]> {
  const search = mechanicQuery(term);
  if (!search) return [];
  let query = supabase.from("profiles").select("id, first_name, last_name, phone").eq("role", "mechanic");
  if (search.by === "phone") query = query.ilike("phone", `%${search.digits}%`);
  else if (search.by === "name") query = query.or(["first_name", "last_name", "full_name"].map((c) => `${c}.ilike.${search.pattern}`).join(","));
  else {
    const { data, error } = await supabase.from("mechanic_profiles").select("id").eq("display_id", search.number);
    if (error) throw error;
    query = query.in("id", data.map((row) => row.id));
  }
  const { data, error } = await query.limit(15);
  if (error) throw error;
  return data;
}

/** The admin picks listings (directly, or from one mechanic) and sets VIP on all of them. */
export const VipAssign = () => {
  const client = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const [mode, setMode] = useState<"service" | "mechanic">("service");
  const [text, setText] = useState("");
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [selected, setSelected] = useState<Map<number, Service>>(new Map());
  const [plan, setPlan] = useState<VipPlan>("vip");
  const [days, setDays] = useState(30);
  const term = useDebounced(text);

  const mechanics = useQuery({
    queryKey: ["vip-assign-mechanics", term],
    enabled: mode === "mechanic" && !mechanic && term.length > 0,
    queryFn: () => findMechanics(term),
  });
  const services = useQuery({
    queryKey: ["vip-assign-services", mode, mode === "service" ? term : mechanic?.id],
    enabled: mode === "service" ? term.length > 1 || !!listingId(term) : !!mechanic,
    queryFn: async () => {
      if (mode === "service") return findServices(term);
      const { data, error } = await supabase
        .from("mechanic_services").select(COLUMNS).eq("mechanic_id", mechanic!.id).eq("is_active", true).order("name");
      if (error) throw error;
      return data as Service[];
    },
  });
  const rows = services.data ?? [];
  const allChecked = rows.length > 0 && rows.every((s) => selected.has(s.id));

  const toggle = (list: Service[], on: boolean) =>
    setSelected((current) => {
      const next = new Map(current);
      list.forEach((s) => (on ? next.set(s.id, s) : next.delete(s.id)));
      return next;
    });

  const reset = (nextMode: "service" | "mechanic") => {
    setMode(nextMode); setText(""); setMechanic(null); setSelected(new Map());
  };

  const apply = useMutation({
    mutationFn: async (on: boolean) => {
      const until = on ? new Date(Date.now() + days * 864e5).toISOString() : null;
      const failed: Service[] = [];
      for (const service of selected.values()) {
        const { error } = await supabase.rpc("update_service_vip_status", {
          p_service_id: service.id,
          // Null clears the VIP fields; the generated types do not express that.
          p_vip_status: (on ? plan : null) as VipPlan,
          p_vip_until: until as string,
          p_is_vip_active: on,
        });
        if (error) failed.push(service);
      }
      return { on, done: selected.size - failed.length, failed };
    },
    onSuccess: ({ on, done, failed }) => {
      if (done) toast.success(on ? `VIP ჩაირთო ${done} განცხადებაზე` : `VIP გამოირთო ${done} განცხადებაზე`);
      if (failed.length) toast.error(`ვერ შესრულდა ${failed.length}: ${failed.map((s) => `#${s.id}`).join(", ")}`);
      // Only the ones that failed stay selected, ready for another try.
      setSelected(new Map(failed.map((s) => [s.id, s])));
      ["vip-assign-services", "mechanic-services", "services"].forEach((key) => client.invalidateQueries({ queryKey: [key] }));
    },
    onError: (error: Error) => toast.error(`ვერ შესრულდა: ${error.message}`),
  });

  const confirmApply = async (on: boolean) => {
    const question = on
      ? `ჩაირთოს ${planName(plan)} ${days} დღით ${selected.size} განცხადებაზე?`
      : `გამოირთოს VIP ${selected.size} განცხადებაზე?`;
    if (await confirm(question)) apply.mutate(on);
  };

  const tab = (id: "service" | "mechanic", label: string) => (
    <button type="button" onClick={() => reset(id)} aria-pressed={mode === id}
      className={`rounded-md px-3 py-1.5 text-sm ${mode === id ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}>{label}</button>
  );
  const name = (m: Mechanic) => `${m.first_name} ${m.last_name}`.trim();

  return (
    <Card className="mb-6">
      {dialog}
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-lg">VIP-ის ხელით ჩართვა</CardTitle>
        <div className="flex gap-1 rounded-lg bg-muted p-1">{tab("service", "სერვისით")}{tab("mechanic", "ხელოსნით")}</div>
      </CardHeader>
      <CardContent className="space-y-3">
        {mode === "mechanic" && mechanic ? (
          <p className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold">{name(mechanic)}</span>
            <span className="text-muted-foreground">{mechanic.phone}</span>
            <button type="button" className="text-primary underline" onClick={() => { setMechanic(null); setSelected(new Map()); }}>სხვა ხელოსანი</button>
          </p>
        ) : (
          <Input value={text} onChange={(e) => setText(e.target.value)}
            placeholder={mode === "service" ? "სერვისის სახელი, ნომერი ან ბმული" : "ხელოსნის სახელი, ტელეფონი ან პროფილის ნომერი"} />
        )}

        {mode === "mechanic" && !mechanic && !!term && (
          mechanics.isFetching ? <Loader2 className="h-5 w-5 animate-spin" />
            : mechanics.isError ? <p role="alert" className="text-sm text-red-600">ძებნა ვერ შესრულდა</p>
              : !mechanics.data?.length ? <p className="text-sm text-muted-foreground">ხელოსანი ვერ მოიძებნა</p>
                : (
                  <ul className="max-h-60 divide-y overflow-y-auto rounded-lg border">
                    {mechanics.data.map((m) => (
                      <li key={m.id}>
                        <button type="button" onClick={() => { setMechanic(m); setSelected(new Map()); }}
                          className="flex w-full justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted">
                          <span className="font-medium">{name(m)}</span><span className="text-muted-foreground">{m.phone}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )
        )}

        {services.isFetching ? <Loader2 className="h-5 w-5 animate-spin" />
          : services.isError ? <p role="alert" className="text-sm text-red-600">ძებნა ვერ შესრულდა</p>
            : services.data && (rows.length === 0 ? <p className="text-sm text-muted-foreground">აქტიური განცხადება ვერ მოიძებნა</p> : (
              <div className="rounded-lg border">
                <label className="flex items-center gap-3 border-b bg-muted/50 px-3 py-2 text-sm font-medium">
                  <input type="checkbox" checked={allChecked} onChange={(e) => toggle(rows, e.target.checked)} />
                  ყველას მონიშვნა ({rows.length})
                </label>
                <ul className="max-h-72 divide-y overflow-y-auto">
                  {rows.map((s) => (
                    <li key={s.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/40">
                        <input type="checkbox" checked={selected.has(s.id)} onChange={(e) => toggle([s], e.target.checked)} />
                        <span className="min-w-0 flex-1 truncate">#{s.id} · {s.name}{s.city ? ` · ${s.city}` : ""}</span>
                        {s.is_vip_active && s.vip_status && (
                          <span className="whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                            {planName(s.vip_status)}{s.vip_until ? ` · ${new Date(s.vip_until).toLocaleDateString("en-GB")}-მდე` : ""}
                          </span>
                        )}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <span className="mr-auto text-sm font-medium">მონიშნულია {selected.size}</span>
            <select aria-label="პაკეტი" value={plan} onChange={(e) => setPlan(e.target.value as VipPlan)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="vip">VIP</option>
              <option value="super_vip">Super VIP</option>
            </select>
            <select aria-label="ვადა" value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              {DURATIONS.map((d) => <option key={d} value={d}>{d} დღე</option>)}
            </select>
            <Button size="sm" disabled={apply.isPending} onClick={() => confirmApply(true)}>
              {apply.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}VIP-ზე გაშვება
            </Button>
            <Button size="sm" variant="outline" disabled={apply.isPending} onClick={() => confirmApply(false)}>VIP-ის გამორთვა</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
