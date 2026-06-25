import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  BarChart3, Eye, Phone, UserRound, Repeat, Search,
  TrendingUp, TrendingDown, Info, Download, Clock, CalendarDays, ListFilter,
} from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

type Daily = { day: string; service_views: number; service_calls: number; mechanic_calls: number; profile_views: number };
type Ev = { ts: string; kind: string; target: string; viewer: string };
type Preset = "today" | "yesterday" | "7" | "30" | "90" | "custom";

const PRESETS: { k: Preset; label: string }[] = [
  { k: "today", label: "დღეს" }, { k: "yesterday", label: "გუშინ" },
  { k: "7", label: "7 დღე" }, { k: "30", label: "30 დღე" }, { k: "90", label: "90 დღე" },
];

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
const todayUTC = () => new Date().toISOString().slice(0, 10);
const addDays = (dateStr: string, n: number) => {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const diffInclusive = (from: string, to: string) =>
  Math.round((+new Date(to + "T00:00:00Z") - +new Date(from + "T00:00:00Z")) / 864e5) + 1;
const labelDM = (dateStr: string) => { const [, m, d] = dateStr.split("-"); return `${+d}/${+m}`; };
const evTime = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const AdminAnalytics = () => {
  const [preset, setPreset] = useState<Preset>("30");
  const [range, setRange] = useState<DateRange | undefined>();
  const [calOpen, setCalOpen] = useState(false);
  const [evFilter, setEvFilter] = useState<"all" | "view" | "call">("all");

  const { from, to } = useMemo(() => {
    const t = todayUTC();
    switch (preset) {
      case "today": return { from: t, to: t };
      case "yesterday": { const y = addDays(t, -1); return { from: y, to: y }; }
      case "7": return { from: addDays(t, -6), to: t };
      case "30": return { from: addDays(t, -29), to: t };
      case "90": return { from: addDays(t, -89), to: t };
      case "custom":
        if (range?.from) { const f = fmtDate(range.from); return { from: f, to: range.to ? fmtDate(range.to) : f }; }
        return { from: t, to: t };
    }
  }, [preset, range]);

  const len = diffInclusive(from, to);
  const prevFrom = addDays(from, -len);

  const daily = useQuery({
    queryKey: ["an-range", prevFrom, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_analytics_range", { p_from: prevFrom, p_to: to });
      if (error) throw error;
      return (data || []) as Daily[];
    },
  });

  const events = useQuery({
    queryKey: ["an-events", from, to, evFilter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_events", {
        p_from: from + "T00:00:00Z",
        p_to: addDays(to, 1) + "T00:00:00Z",
        p_limit: 500,
      });
      if (error) throw error;
      return (data || []) as Ev[];
    },
  });

  const searches = useQuery({
    queryKey: ["an-searches"],
    queryFn: async () => {
      const { data } = await supabase.from("search_queries").select("query, search_count").order("search_count", { ascending: false }).limit(10);
      return data || [];
    },
  });

  const rows = daily.data || [];
  const curRows = rows.filter(r => r.day >= from);
  const prevRows = rows.filter(r => r.day < from);
  const sumK = (arr: Daily[], keys: (keyof Daily)[]) => arr.reduce((s, r) => s + keys.reduce((a, k) => a + (Number(r[k]) || 0), 0), 0);
  const kpi = (keys: (keyof Daily)[]) => {
    const cur = sumK(curRows, keys), prev = sumK(prevRows, keys);
    return { cur, change: prev ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0 };
  };
  const mViews = kpi(["service_views"]);
  const mCalls = kpi(["service_calls", "mechanic_calls"]);
  const mServiceCalls = kpi(["service_calls"]);
  const mProfile = kpi(["profile_views"]);
  const conv = mViews.cur > 0 ? Math.round((mServiceCalls.cur / mViews.cur) * 100) : null;

  const series = useMemo(() => curRows.map(r => ({
    label: labelDM(r.day), ნახვები: Number(r.service_views) || 0,
    დარეკვები: (Number(r.service_calls) || 0) + (Number(r.mechanic_calls) || 0),
  })), [curRows]);

  // top services (calls) computed from the event feed
  const topServices = useMemo(() => {
    const cnt: Record<string, number> = {};
    (events.data || []).forEach(e => { if (e.kind.startsWith("დარეკვა")) cnt[e.target] = (cnt[e.target] || 0) + 1; });
    return Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, n]) => ({ name, n }));
  }, [events.data]);

  const byHour = useMemo(() => {
    const h = Array.from({ length: 24 }, (_, i) => ({ h: i, n: 0 }));
    (events.data || []).forEach(e => { if (e.kind.startsWith("დარეკვა")) h[new Date(e.ts).getHours()].n++; });
    return h;
  }, [events.data]);
  const maxHour = Math.max(1, ...byHour.map(h => h.n));

  const filteredEvents = useMemo(() => (events.data || []).filter(e =>
    evFilter === "all" ? true : evFilter === "view" ? e.kind === "ნახვა" : e.kind.startsWith("დარეკვა")
  ), [events.data, evFilter]);

  const periodLabel = preset === "custom" && range?.from
    ? `${labelDM(from)} – ${labelDM(to)}`
    : PRESETS.find(p => p.k === preset)?.label || `${labelDM(from)} – ${labelDM(to)}`;

  const exportCsv = () => {
    const lines = ["დრო,ტიპი,სამიზნე,მომხმარებელი"];
    (events.data || []).forEach(e => lines.push(`${evTime(e.ts)},${e.kind},"${e.target.replace(/"/g, "'")}","${e.viewer.replace(/"/g, "'")}"`));
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `events-${from}_${to}.csv`; a.click();
  };

  const Kpi = ({ icon: Icon, label, value, change, color }: { icon: typeof Eye; label: string; value: number | null; change: number | null; color: string }) => (
    <Card><CardContent className="p-4">
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
    </CardContent></Card>
  );

  const loading = daily.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" />ანალიტიკა</h1>
          <p className="text-sm text-muted-foreground mt-1">{periodLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {PRESETS.map(p => (
              <button key={p.k} onClick={() => setPreset(p.k)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${preset === p.k ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                {p.label}
              </button>
            ))}
          </div>
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <button className={`flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm transition-colors ${preset === "custom" ? "border-primary text-primary bg-primary/5" : "hover:bg-muted"}`}>
                <CalendarDays className="h-4 w-4" />{preset === "custom" && range?.from ? `${labelDM(from)}–${labelDM(to)}` : "პერიოდი"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="range" selected={range} onSelect={(r) => { setRange(r); setPreset("custom"); }} numberOfMonths={2} />
            </PopoverContent>
          </Popover>
          <button onClick={exportCsv} className="flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm hover:bg-muted transition-colors">
            <Download className="h-4 w-4" />CSV
          </button>
        </div>
      </div>

      {daily.isError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>აგრეგაცია ვერ ჩაიტვირთა — გაუშვი migration (get_admin_analytics_range / get_admin_events), შემდეგ refresh.</span>
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
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(series.length / 10))} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="ნახვები" stroke="#2563eb" strokeWidth={2} fill="url(#gv)" dot={{ r: 2, fill: "#2563eb", strokeWidth: 0 }} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="დარეკვები" stroke="#16a34a" strokeWidth={2} fill="url(#gc)" dot={{ r: 2, fill: "#16a34a", strokeWidth: 0 }} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* DRILL-DOWN: who viewed / called what */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2"><ListFilter className="h-5 w-5 text-primary" />დეტალური აქტივობა</CardTitle>
            <div className="flex gap-1 bg-muted rounded-lg p-0.5 text-xs">
              {([["all", "ყველა"], ["view", "ნახვები"], ["call", "დარეკვები"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setEvFilter(k)} className={`px-2.5 py-1 rounded-md transition-colors ${evFilter === k ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}>{l}</button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {events.isLoading ? <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div> :
            filteredEvents.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">ამ პერიოდში აქტივობა არ ყოფილა</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="py-2 pr-2 font-medium">დრო</th><th className="py-2 px-2 font-medium">ტიპი</th>
                    <th className="py-2 px-2 font-medium">სამიზნე</th><th className="py-2 pl-2 font-medium">მომხმარებელი</th>
                  </tr></thead>
                  <tbody>
                    {filteredEvents.slice(0, 200).map((e, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1.5 pr-2 whitespace-nowrap text-muted-foreground">{evTime(e.ts)}</td>
                        <td className="py-1.5 px-2 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${e.kind === "ნახვა" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
                            {e.kind === "ნახვა" ? <Eye className="h-3 w-3" /> : <Phone className="h-3 w-3" />}{e.kind}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 truncate max-w-[260px]">{e.target}</td>
                        <td className="py-1.5 pl-2 truncate max-w-[160px] text-muted-foreground">{e.viewer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredEvents.length > 200 && <p className="text-xs text-muted-foreground pt-2 text-center">ნაჩვენებია ბოლო 200 (სულ {filteredEvents.length}). CSV-ში ყველაა.</p>}
              </div>
            )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Phone className="h-5 w-5 text-green-600" />Top სერვისები (დარეკვით)</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {topServices.length === 0 ? <p className="text-sm text-muted-foreground py-3">ამ პერიოდში დარეკვა არ ყოფილა</p> :
              topServices.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                  <span className="w-5 text-center text-sm font-semibold text-muted-foreground">{i + 1}</span>
                  <span className="flex-1 text-sm truncate">{s.name}</span>
                  <span className="text-sm font-semibold">{s.n}</span>
                </div>
              ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Search className="h-5 w-5 text-primary" />Top ძიებები</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {(searches.data || []).map((s, i) => (
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
    </div>
  );
};

export default AdminAnalytics;
