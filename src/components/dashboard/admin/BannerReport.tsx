import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const PERIODS = [{ days: 7, label: "7 დღე" }, { days: 30, label: "30 დღე" }, { days: 0, label: "სულ" }];

/** Numbers an advertiser can be shown: views, clicks and their share for a period. */
export const BannerReport = ({ bannerId, label }: { bannerId: string; label: string }) => {
  const [days, setDays] = useState(30);
  const report = useQuery({
    queryKey: ["banner-report", bannerId, days],
    queryFn: async () => {
      const count = async (type: "impression" | "click") => {
        let query = supabase.from("banner_analytics").select("id", { count: "exact", head: true }).eq("banner_id", bannerId).eq("event_type", type);
        if (days) query = query.gte("created_at", new Date(Date.now() - days * 864e5).toISOString());
        const { count: total, error } = await query;
        if (error) throw error;
        return total ?? 0;
      };
      const [views, clicks] = await Promise.all([count("impression"), count("click")]);
      return { views, clicks, share: views ? (clicks / views) * 100 : 0 };
    },
  });
  const copy = async () => {
    if (!report.data) return;
    const period = days ? `ბოლო ${days} დღე` : "მთელი პერიოდი";
    await navigator.clipboard.writeText(`Fixup.ge ბანერი (${label}), ${period}, ${new Date().toLocaleDateString("ka-GE")}\nნახვა: ${report.data.views}\nდაჭერა: ${report.data.clicks}\nდაჭერის წილი: ${report.data.share.toFixed(2)}%`);
    toast.success("ანგარიში დაკოპირდა");
  };

  return (
    <div className="mt-3 border-t pt-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((period) => (
          <Button key={period.days} size="sm" variant={days === period.days ? "default" : "outline"} onClick={() => setDays(period.days)}>{period.label}</Button>
        ))}
        <Button size="sm" variant="ghost" disabled={!report.data} onClick={copy}>კოპირება</Button>
      </div>
      <p className="mt-2 text-muted-foreground">
        {report.isError ? "ვერ ჩაიტვირთა" : report.data ? `ნახვა ${report.data.views.toLocaleString()} · დაჭერა ${report.data.clicks.toLocaleString()} · ${report.data.share.toFixed(2)}%` : "იტვირთება…"}
      </p>
    </div>
  );
};
