import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3, Eye, Phone, UserRound, Repeat, Search,
  TrendingUp, TrendingDown, Info,
} from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const PERIODS = [{ d: 7, label: "7 დღე" }, { d: 30, label: "30 დღე" }, { d: 90, label: "90 დღე" }];
const DAY = 864e5;
type Ev = { service_id?: number; created_at: string };

const AdminAnalytics = () => {
  const [days, setDays] = useState(30);

  // Pull raw events for a 2× window (current + previous, for trend). Graceful if a table is missing.
  const eventsFetcher = (table: string, withService: boolean) => async () => {
    const since = new Date(Date.now() - days * 2 * DAY).toISOString();
    const cols = withService ? "service_id, created_at" : "created_at";
    const { data, error } = await supabase.from(table).select(cols).gte("created_at", since).limit(50000);
    if (error) return null;
    return (data || []) as unknown as Ev[];
  };

  const calls = useQuery({ queryKey: ["an-calls", days], queryFn: eventsFetcher("service_phone_views", true) });
  const sviews = useQuery({ queryKey: ["an-sviews", days], queryFn: eventsFetcher("service_views", true) });
  const pviews = useQuery({ queryKey: ["an-pviews", days], queryFn: eventsFetcher("mechanic_profile_views", false) });
  const searches = useQuery({
    queryKey: ["an-searches"],
    queryFn: async () => {
      const { data } = await supabase.from("search_queries").select("query, search_count").order("search_count", { ascending: false }).limit(12);
      return data || [];
    },
  });

  const metric = (rows: Ev[] | null | undefined) => {
    if (!rows) return { cur: null as number | null, change: null as number | null };
    const now = Date.now(), curStart = now - days * DAY;
    let cur = 0, prev = 0;
    for (const r of rows) { const t = +new Date(r.created_at); if (t >= curStart) cur++; else prev++; }
    return { cur, change: prev ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0 };
  };

  const mCalls = metric(calls.data);
  const mViews = metric(sviews.data);
  const mProfile = metric(pviews.data);
  const conv = mViews.cur && mViews.cur > 0 && mCalls.cur != null ? Math.round((mCalls.cur / mViews.cur) * 100) : null;

  const series = useMemo(() => {
    const curStart = Date.now() - days * DAY;
    const buckets: Record<string, { key: string; label: string; ნახვები: number; დარეკვები: number }> = {};
    const out: { key: string; label: string; ნახვები: number; დარეკვები: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(curStart + i * DAY);
      const key = d.toISOString().slice(0, 10);
      const o = { key, label: `${d.getDate()}/${d.getMonth() + 1}`, ნახვები: 0, დარეკვები: 0 };
      buckets[key] = o; out.push(o);
    }
    (sviews.data || []).forEach(r => { const k = String(r.created_at).slice(0, 10); if (buckets[k]) buckets[k].ნახვები++; });
    (calls.data || []).forEach(r => { const k = String(r.created_at).slice(0, 10); if (buckets[k]) buckets[k].დარეკვები++; });
    return out;
  }, [sviews.data, calls.data, days]);

  const topServiceIds = useMemo(() => {
    const curStart = Date.now() - days * DAY;
    const cnt: Record<number, number> = {};
    (calls.data || []).forEach(r => { if (r.service_id && +new Date(r.created_at) >= curStart) cnt[r.service_id] = (cnt[r.service_id] || 0) + 1; });
    return Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, c]) => ({ id: Number(id), calls: c }));
  }, [calls.data, days]);

  const topServices = useQuery({
    queryKey: ["an-top-services", topServiceIds.map(s => s.id).join(",")],
    enabled: topServiceIds.length > 0,
    queryFn: async () => {
      const ids = topServiceIds.map(s => s.id);
      const { data } = await supabase.from("mechanic_services").select("id, name").in("id", ids);
      const names = Object.fromEntries((data || []).map(s => [s.id, s.name]));
      return topServiceIds.map(s => ({ ...s, name: names[s.id] || `#${s.id}` }));
    },
  });

  const loading = calls.isLoading || pviews.isLoading;

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" />ანალიტიკა</h1>
          <p className="text-sm text-muted-foreground mt-1">ნახვები, დარეკვები და კონვერსია</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {PERIODS.map(p => (
            <button key={p.d} onClick={() => setDays(p.d)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${days === p.d ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {sviews.data === null && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>სერვისის ნახვების აღრიცხვა ახლახ ჩაირთო — მონაცემი დაგროვებას იწყებს. ნახვები/კონვერსია მალე გამოჩნდება.</span>
        </div>
      )}

      {/* KPIs */}
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
      {conv != null && <p className="text-xs text-muted-foreground -mt-3">კონვერსია = დარეკვები / ნახვები ({conv}% მნახველი რეკავს)</p>}

      {/* Trend chart */}
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
                <Area type="monotone" dataKey="ნახვები" stroke="#2563eb" strokeWidth={2} fill="url(#gv)" />
                <Area type="monotone" dataKey="დარეკვები" stroke="#16a34a" strokeWidth={2} fill="url(#gc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top services + searches */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Phone className="h-5 w-5 text-green-600" />Top სერვისები (დარეკვით)</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {topServices.isLoading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />) :
              (topServices.data || []).length === 0 ? <p className="text-sm text-muted-foreground py-3">ამ პერიოდში დარეკვა არ ყოფილა</p> :
                (topServices.data || []).map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 py-1.5 border-b last:border-0">
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
    </div>
  );
};

export default AdminAnalytics;
