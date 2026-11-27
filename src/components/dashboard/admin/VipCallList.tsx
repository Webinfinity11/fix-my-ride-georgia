import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { growthDb } from "@/lib/growthDb";
import { nationalDigits } from "@/lib/vipPhone";

type Row = { mechanic_id: string; name: string; phone: string; views: number; clicks: number; listings: number; status: "called" | "rejected" | null };

/** Owners without VIP whom people already contact: the best ones to offer it to. */
export const VipCallList = () => {
  const client = useQueryClient();
  const [all, setAll] = useState(false);
  const list = useQuery({
    queryKey: ["vip-call-list"],
    queryFn: async () => {
      const { data, error } = await growthDb.rpc("get_vip_call_list", { p_days: 30 });
      if (error) throw error;
      return data as Row[];
    },
  });
  const mark = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Row["status"] }) => {
      const table = growthDb.from("vip_outreach");
      const { error } = await (status
        ? table.upsert({ mechanic_id: id, status, updated_at: new Date().toISOString() })
        : table.delete().eq("mechanic_id", id));
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["vip-call-list"] }),
    onError: (error: Error) => toast.error(`ვერ შესრულდა: ${error.message}`),
  });
  const rows = (list.data ?? []).filter((row) => row.status !== "rejected");

  return (
    <Card className="mb-6">
      <CardHeader><CardTitle className="text-lg">ვის დავურეკოთ VIP-ზე (30 დღე)</CardTitle></CardHeader>
      <CardContent>
        {list.isError ? (
          <p role="alert" className="text-sm text-red-600">სია ვერ ჩაიტვირთა. შეამოწმეთ, გაშვებულია თუ არა `growth` მიგრაცია.</p>
        ) : list.isLoading ? (
          <p className="text-sm text-muted-foreground">იტვირთება…</p>
        ) : (
          <ul className="divide-y">
            {rows.slice(0, all ? rows.length : 10).map((row) => (
              <li key={row.mechanic_id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-sm">
                <span className="min-w-[10rem] flex-1 font-medium">{row.name || "უსახელო"}</span>
                <a href={`tel:+995${nationalDigits(row.phone)}`} className="font-semibold text-primary hover:underline">{row.phone}</a>
                <span className="text-muted-foreground">ნახვა {row.views} · დაჭერა {row.clicks} · განცხადება {row.listings}</span>
                <Button size="sm" variant={row.status === "called" ? "secondary" : "outline"}
                  onClick={() => mark.mutate({ id: row.mechanic_id, status: row.status === "called" ? null : "called" })}>
                  {row.status === "called" ? "დარეკილია ✓" : "დავურეკე"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => mark.mutate({ id: row.mechanic_id, status: "rejected" })}>უარი</Button>
              </li>
            ))}
          </ul>
        )}
        {rows.length > 10 && (
          <Button variant="link" className="px-0" onClick={() => setAll(!all)}>{all ? "ნაკლები" : `ყველა (${rows.length})`}</Button>
        )}
      </CardContent>
    </Card>
  );
};
