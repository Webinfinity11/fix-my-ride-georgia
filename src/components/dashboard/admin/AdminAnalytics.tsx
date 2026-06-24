import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3, Eye, Phone, UserRound, Repeat, Search,
  TrendingUp, TrendingDown, Info, Download, Clock, MapPin, Layers,
} from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const PERIODS = [{ d: 7, label: "7 დღე" }, { d: 30, label: "30 დღე" }, { d: 90, label: "90 დღე" }];
const DAY = 864e5;
type Daily = { day: string; service_views: number; service_calls: number; mechanic_calls: number; profile_views: number };

const AdminAnalytics = () => {
  const [days, setDays] = useState(30);

  // EXACT server-side daily aggregation (admin-only RPC). 2*days rows: prev + current period.
  const daily = useQuery({
    queryKey: ["an-daily", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_analytics", { p_days: days });
      if (error) throw error;
      return (data || []) as Daily[];
    },
  });

  const top = useQuery({
    queryKey: ["an-top", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_top_called_services", { p_days: days, p_limit: 8 });
      if (error) throw error;
      return (data || []) as { service_id: number; name: string; calls: number }[];
    },
  });

  const searches = useQuery({
    queryKey: ["an-searches"],
    queryFn: async () => {
      const { data } = await supabase.from("search_queries").select("query, search_count").order("search_count", { ascending: false }).limit(12);
      return data || [];
    },
  });

  // Recent service calls — for the (secondary) hour/city/category breakdowns.
  const recentCalls = useQuery({
    queryKey: ["an-recent-calls", days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * DAY).toISOString();
      const { data, error } = await supabase.from("service_phone_views")
        .select("service_id, created_at").gte("created_at", since)
        .order("created_at", { ascending: false }).limit(10000);
      if (error) return [] as { service_id: number; created_at: string }[];
      return (data || []) as { service_id: number; created_at: string }[];
    },
  });

  const rows = daily.data || [];
  const half = Math.floor(rows.length / 2);
  const curRows = rows.slice(half);
  const prevRows = rows.slice(0, half);
  const sumKeys = (arr: Daily[], keys: (keyof Daily)[]) =>
    arr.reduce((s, r) => s + keys.reduce((a, k) => a + (Number(r[k]) || 0), 0), 0);
  const kpi = (keys: (keyof Daily)[]) => {
    const cur = sumKeys(curRows, keys), prev = sumKeys(prevRows, keys);
    return { cur, change: prev ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0 };
  };
  const mViews = kpi(["service_views"]);
  const mCalls = kpi(["service_calls", "mechanic_calls"]);
  const mServiceCalls = kpi(["service_calls"]);
  const mProfile = kpi(["profile_views"]);
  const conv = mViews.cur > 0 ? Math.round((mServiceCalls.cur / mViews.cur) * 100) : null;

  const series = useMemo(() => curRows.map(r => {
    const [, m, d] = r.day.split("-");
    return { label: `${+d}/${+m}`, ნახვები: Number(r.service_views) || 0, დარეკვები: (Number(r.service_calls) || 0) + (Number(r.mechanic_calls) || 0) };
  }), [curRows]);

  // Secondary breakdowns from recent calls
  const byHour = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({ h, label: `${h}`, n: 0 }));
    (recentCalls.data || []).forEach(r => { hours[new Date(r.created_at).getHours()].n++; });
    return hours;
  }, [recentCalls.data]);

  const callServiceIds = useMemo(() => [...new Set((recentCalls.data || []).map(r => r.service_id).filter(Boolean))], [recentCalls.data]);
  const serviceMeta = useQuery({
    queryKey: ["an-svc-meta", callServiceIds.join(",")],
    enabled: callServiceIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("mechanic_services").select("id, city, service_categories(name)").in("id", callServiceIds);
      const map: Record<number, { city: string | null; category: string | null }> = {};
      (data || []).forEach((s: { id: number; city: string | null; service_categories: { name: string } | null }) =>
        { map[s.id] = { city: s.city, category: s.service_categories?.name || null }; });
      return map;
    },
  });
  const breakdown = (pick: (m: { city: string | null; category: string | null }) => string | null) => {
    const meta = serviceMeta.data;
    if (!meta) return [];
    const cnt: Record<string, number> = {};
    (recentCalls.data || []).forEach(r => {
      const key = (r.service_id && meta[r.service_id] && pick(meta[r.service_id])) || "უცნობი";
      cnt[key] = (cnt[key] || 0) + 1;
    });
    return Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, n]) => ({ name, n }));
  };
  const byCity = useMemo(() => breakdown(m => m.city), [serviceMeta.data, recentCalls.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const byCategory = useMemo(() => breakdown(m => m.category), [serviceMeta.data, recentCalls.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const exportCsv = () => {
    const lines: string[] = ["სექცია,დასახელება,რაოდენობა"];
    series.forEach(d => lines.push(`დღე,${d.label},ნახვები=${d.ნახვები} დარეკვები=${d.დარეკვები}`));
    (top.data || []).forEach(s => lines.push(`top-სერვისი,"${s.name.replace(/"/g, "'")}",${s.calls}`));
    byCity.forEach(c => lines.push(`ქალაქი,${c.name},${c.n}`));
    byCategory.forEach(c => lines.push(`კატეგორია,${c.name},${c.n}`));
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `analytics-${days}d.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const loading = daily.isLoading;
  const maxHour = Math.max(1, ...byHour.map(h => h.n));

  const Kpi = ({ icon: Icon, label, value, change, color }: { icon: typeof Eye; label: string; value: number | null; change: number | null; color: string }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}><Icon className="h-4 w-4" /></span>
          {change != null && (
            <span className={`text-xs font-medium flex items-center gap-0.5 ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
              {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{Math.abs(change)}%
            </span>
          )}
        </div>
        <div className="text-2xl font-bold">{value ?? "—"}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );

  const Bars = ({ items }: { items: { name: string; n: number }[] }) => {
    const max = Math.max(1, ...items.map(i => i.n));
    return (
      <div className="space-y-2">
        {items.length === 0 ? <p className="text-sm text-muted-foreground py-3">მონაცემი არ არის</p> : items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-24 text-sm truncate shrink-0">{it.name}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${(it.n / max) * 100}%` }} /></div>
            <span className="w-8 text-right text-sm font-medium">{it.n}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" />ანალიტიკა</h1>
          <p className="text-sm text-muted-foreground mt-1">ნახვები, დარეკვები და კონვერსია</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {PERIODS.map(p => (
              <button key={p.d} onClick={() => setDays(p.d)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${days === p.d ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={exportCsv} className="flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm hover:bg-muted transition-colors">
            <Download className="h-4 w-4" />CSV
          </button>
        </div>
      </div>

      {daily.isError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>აგრეგაციის ფუნქცია ვერ ჩაიტვირთა — გაუშვი migration `get_admin_analytics` (SQL Editor), შემდეგ განაახლე გვერდი.</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) : (
          <>
            <Kpi icon={Eye} label="სერვისის ნახვები" value={mViews.cur} change={mViews.change} color="bg-blue-50 text-blue-600" />
            <Kpi icon={Phone} label="დარეკვები" value={mCalls.cur} change={mCalls.change} color="bg-green-50 text-green-600" />
            <Kpi icon={Repeat} label="კონვერსია" value={conv} change={null} color="bg-purple-50 text-purple-600" />
            <Kpi icon={UserRound} label="პროფილის ნახვები" value={mProfile.cur} change={mProfile.change} color="bg-orange-50 text-orange-600" />
          </>
        )}
      </div>
      {conv != null && <p className="text-xs text-muted-foreground -mt-3">კონვერსია = სერვისის დარეკვები / ნახვები ({conv}% მნახველი რეკავს)</p>}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />ნახვები vs დარეკვები</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} /><stop offset="100%" stopColor="#2563eb" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16a34a" stopOpacity={0.3} /><stop offset="100%" stopColor="#16a34a" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(days / 10))} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="ნახვები" stroke="#2563eb" strokeWidth={2} fill="url(#gv)" dot={{ r: 2, fill: "#2563eb", strokeWidth: 0 }} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="დარეკვები" stroke="#16a34a" strokeWidth={2} fill="url(#gc)" dot={{ r: 2, fill: "#16a34a", strokeWidth: 0 }} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Phone className="h-5 w-5 text-green-600" />Top სერვისები (დარეკვით)</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {top.isLoading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />) :
              (top.data || []).length === 0 ? <p className="text-sm text-muted-foreground py-3">ამ პერიოდში დარეკვა არ ყოფილა</p> :
                (top.data || []).map((s, i) => (
                  <div key={s.service_id} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                    <span className="w-5 text-center text-sm font-semibold text-muted-foreground">{i + 1}</span>
                    <span className="flex-1 text-sm truncate">{s.name}</span>
                    <span className="text-sm font-semibold">{s.calls}</span>
                  </div>
                ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Search className="h-5 w-5 text-primary" />Top ძიებები</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {searches.isLoading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />) :
              (searches.data || []).length === 0 ? <p className="text-sm text-muted-foreground py-3">ცარიელია</p> :
                (searches.data || []).map((s, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                    <span className="w-5 text-center text-sm font-semibold text-muted-foreground">{i + 1}</span>
                    <span className="flex-1 text-sm truncate">{s.query}</span>
                    <span className="text-sm font-semibold">{s.search_count}</span>
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />დარეკვის peak საათები</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-32">
            {byHour.map(h => (
              <div key={h.h} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full rounded-t bg-primary/80 hover:bg-primary transition-colors relative" style={{ height: `${(h.n / maxHour) * 100}%`, minHeight: h.n > 0 ? 3 : 0 }}>
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100">{h.n}</span>
                </div>
                {h.h % 3 === 0 && <span className="text-[9px] text-muted-foreground">{h.h}</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-5 w-5 text-blue-600" />დარეკვები ქალაქებით</CardTitle></CardHeader>
          <CardContent>{serviceMeta.isLoading ? <Skeleton className="h-24 w-full" /> : <Bars items={byCity} />}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Layers className="h-5 w-5 text-purple-600" />დარეკვები კატეგორიებით</CardTitle></CardHeader>
          <CardContent>{serviceMeta.isLoading ? <Skeleton className="h-24 w-full" /> : <Bars items={byCategory} />}</CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
