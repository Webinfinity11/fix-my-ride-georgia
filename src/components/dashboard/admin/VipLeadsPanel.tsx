import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { promoActive, timeLeft, useVipPricing } from "@/lib/vipPricing";

const STATUSES = [
  { id: "new", label: "ახალი" },
  { id: "contacted", label: "დავურეკეთ" },
  { id: "paid", label: "გადაიხადა" },
  { id: "activated", label: "ჩაირთო" },
  { id: "rejected", label: "უარი" },
];
const PROMO_HOURS = 24;

/** Accepts a listing number or its link (https://fixup.ge/service/123-name). */
const listingId = (value: string) => Number(value.trim().match(/(?:^|\/service\/)(\d+)(?:\D|$)/)?.[1]) || null;

export const VipLeadsPanel = () => {
  const client = useQueryClient();
  const { pricing, now } = useVipPricing();
  const active = promoActive(pricing, now);

  const leads = useQuery({
    queryKey: ["vip-leads"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vip_leads").select("*, mechanic_services(name)").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  const refresh = () => {
    client.invalidateQueries({ queryKey: ["vip-leads"] });
    client.invalidateQueries({ queryKey: ["vip-leads-new-count"] });
  };
  const onError = (error: Error) => toast.error(`ვერ შესრულდა: ${error.message}`);

  const setPromo = useMutation({
    mutationFn: async (endsAt: string | null) => {
      // .select() so that a write blocked by access rules is reported, not silent.
      const { error } = await supabase.from("vip_pricing").update({ promo_ends_at: endsAt }).eq("id", true).select().single();
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["vip-pricing"] }),
    onError,
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { error } = await supabase.from("vip_leads").update({ status }).eq("id", id).select().single();
      if (error) throw error;
    },
    onSuccess: refresh,
    onError,
  });

  const activate = useMutation({
    mutationFn: async (lead: { id: number; plan: string; service_id: number }) => {
      const { data: service, error: serviceError } = await supabase
        .from("mechanic_services").select("name").eq("id", lead.service_id).single();
      if (serviceError) throw new Error("ასეთი განცხადება ვერ მოიძებნა");
      if (!window.confirm(`ჩაირთოს VIP განცხადებაზე „${service.name}“? ჯერ დარწმუნდით, რომ გადახდილია.`)) return false;
      const until = new Date(Date.now() + pricing.duration_days * 864e5).toISOString();
      const { error } = await supabase.rpc("update_service_vip_status", {
        p_service_id: lead.service_id, p_vip_status: lead.plan as "vip" | "super_vip", p_vip_until: until, p_is_vip_active: true,
      });
      if (error) throw error;
      const { error: statusError } = await supabase
        .from("vip_leads").update({ status: "activated", service_id: lead.service_id }).eq("id", lead.id);
      if (statusError) throw statusError;
      return true;
    },
    onSuccess: (done) => { if (done) { toast.success("VIP ჩაირთო"); refresh(); } },
    onError,
  });

  const startPromo = () => {
    if (window.confirm(`ჩაირთოს აქცია ${PROMO_HOURS} საათით (VIP −${pricing.vip_discount_percent}%, Super VIP −${pricing.super_vip_discount_percent}%)? ფასდაკლება მაშინვე გამოჩნდება საიტზე.`)) {
      setPromo.mutate(new Date(Date.now() + PROMO_HOURS * 3600e3).toISOString());
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="text-lg">მოთხოვნები /vip გვერდიდან</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {active ? `აქცია მოქმედებს, დარჩა ${timeLeft(pricing.promo_ends_at!, now)}` : "აქცია ამჟამად გამორთულია"}
          </p>
        </div>
        {active ? (
          <Button variant="outline" disabled={setPromo.isPending}
            onClick={() => window.confirm("დასრულდეს აქცია ახლავე?") && setPromo.mutate(null)}>აქციის დასრულება</Button>
        ) : (
          <Button disabled={setPromo.isPending} onClick={startPromo}>{PROMO_HOURS}-საათიანი აქციის დაწყება</Button>
        )}
      </CardHeader>
      <CardContent>
        {leads.isError ? (
          <p role="alert" className="text-sm text-red-600">მოთხოვნები ვერ ჩაიტვირთა. შეამოწმეთ, გაშვებულია თუ არა `vip_offers` მიგრაცია.</p>
        ) : leads.isLoading ? (
          <p className="text-sm text-muted-foreground">იტვირთება…</p>
        ) : !leads.data?.length ? (
          <p className="py-4 text-center text-sm text-muted-foreground">მოთხოვნები ჯერ არ არის</p>
        ) : (
          <ul className="divide-y">
            {leads.data.map((lead) => (
              <li key={lead.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-sm">
                <span className="w-28 text-muted-foreground">{new Date(lead.created_at).toLocaleString("ka-GE", { dateStyle: "short", timeStyle: "short" })}</span>
                <a href={`tel:+995${lead.phone}`} className="font-semibold text-primary hover:underline">{lead.phone}</a>
                <a href={`https://wa.me/995${lead.phone}`} target="_blank" rel="noreferrer" className="font-medium text-green-700 hover:underline">WhatsApp</a>
                <span className="font-medium">{lead.plan === "vip" ? "VIP" : "Super VIP"} · {lead.price_gel} ₾</span>
                {lead.email && <a href={`mailto:${lead.email}`} className="text-muted-foreground hover:underline">{lead.email}</a>}
                {lead.service_id && (
                  <Link to={`/service/${lead.service_id}`} target="_blank" className="max-w-[260px] truncate hover:underline">
                    {lead.mechanic_services?.name ?? `განცხადება #${lead.service_id}`}
                  </Link>
                )}
                <span className="ml-auto flex flex-wrap items-center gap-2">
                  <select aria-label="სტატუსი" value={lead.status} onChange={(e) => setStatus.mutate({ id: lead.id, status: e.target.value })}
                    className="h-9 rounded-md border border-input bg-background px-2">
                    {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  {lead.status !== "activated" && (
                    <form className="flex items-center gap-2" onSubmit={(e) => {
                      e.preventDefault();
                      const id = listingId(String(new FormData(e.currentTarget).get("listing") ?? ""));
                      if (!id) { toast.error("ჩაწერეთ განცხადების ნომერი ან ბმული"); return; }
                      activate.mutate({ id: lead.id, plan: lead.plan, service_id: id });
                    }}>
                      <input name="listing" aria-label="განცხადების ნომერი ან ბმული" placeholder="განცხადების № ან ბმული"
                        defaultValue={lead.service_id ?? ""} className="h-9 w-48 rounded-md border border-input bg-background px-2" />
                      <Button type="submit" size="sm" variant="outline" disabled={activate.isPending}>VIP ჩართვა</Button>
                    </form>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
