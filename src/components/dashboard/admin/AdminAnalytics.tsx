import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Eye, Phone, Repeat, Search, Info, Download, CalendarDays, ListFilter, ChartNoAxesColumn } from "lucide-react";
import OverviewTab from "./analytics/OverviewTab";
import {
  addDays, calendarDay, dailyCsv, downloadCsv, labelDM, Overview, TBILISI_OFFSET, tbilisiToday,
} from "./analytics/overview";

type Ev = { ts: string; kind: string; target: string; viewer: string; link: string | null };
type Preset = "today" | "yesterday" | "7" | "30" | "90" | "custom";

const PRESETS: { k: Preset; label: string }[] = [
  { k: "today", label: "დღეს" }, { k: "yesterday", label: "გუშინ" },
  { k: "7", label: "7 დღე" }, { k: "30", label: "30 დღე" }, { k: "90", label: "90 დღე" },
];
const EVENT_LIMIT = 500;

// The database calls a number click a "call"; the site cannot know a call happened.
const kindLabel = (kind: string) => kind.replace("დარეკვა", "დაჭერა");
const dayStart = (day: string) => `${day}T00:00:00${TBILISI_OFFSET}`;
const evTime = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tbilisi", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
    .format(new Date(iso)).replace(",", "");

const AdminAnalytics = () => {
  const [preset, setPreset] = useState<Preset>("30");
  const [range, setRange] = useState<DateRange | undefined>();
  const [calOpen, setCalOpen] = useState(false);
  const [tab, setTab] = useState("overview");
  const [evFilter, setEvFilter] = useState<"all" | "view" | "call" | "search">("all");
  const [activeSvc, setActiveSvc] = useState<{ id: number; name: string } | null>(null);

  const { from, to } = useMemo(() => {
    const t = tbilisiToday();
    switch (preset) {
      case "today": return { from: t, to: t };
      case "yesterday": { const y = addDays(t, -1); return { from: y, to: y }; }
      case "7": return { from: addDays(t, -6), to: t };
      case "30": return { from: addDays(t, -29), to: t };
      case "90": return { from: addDays(t, -89), to: t };
      case "custom":
        if (range?.from) { const f = calendarDay(range.from); return { from: f, to: range.to ? calendarDay(range.to) : f }; }
        return { from: t, to: t };
    }
  }, [preset, range]);

  const overview = useQuery({
    queryKey: ["an-overview", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_overview", { p_from: from, p_to: to });
      if (error) throw error;
      return data as unknown as Overview;
    },
  });

  const events = useQuery({
    queryKey: ["an-events", from, to],
    enabled: tab === "activity",
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_events", {
        p_from: dayStart(from), p_to: dayStart(addDays(to, 1)), p_limit: EVENT_LIMIT,
      });
      if (error) throw error;
      return (data || []) as Ev[];
    },
  });

  const svcActivity = useQuery({
    queryKey: ["svc-activity", activeSvc?.id, from, to],
    enabled: !!activeSvc,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_service_activity", {
        p_service_id: activeSvc!.id, p_from: dayStart(from), p_to: dayStart(addDays(to, 1)), p_limit: 1000,
      });
      if (error) throw error;
      return (data || []) as { ts: string; kind: string; viewer: string }[];
    },
  });
  const svcViews = (svcActivity.data || []).filter(e => e.kind === "ნახვა").length;
  const svcCalls = (svcActivity.data || []).filter(e => e.kind === "დარეკვა").length;
  const svcConv = svcViews > 0 ? Math.round((svcCalls / svcViews) * 100) : null;

  const filteredEvents = useMemo(() => (events.data || []).filter(e =>
    evFilter === "all" ? true
      : evFilter === "view" ? e.kind === "ნახვა"
        : evFilter === "search" ? e.kind === "ძიება"
          : e.kind.startsWith("დარეკვა")
  ), [events.data, evFilter]);

  const periodLabel = preset === "custom" && range?.from
    ? `${labelDM(from)} – ${labelDM(to)}`
    : PRESETS.find(p => p.k === preset)?.label || `${labelDM(from)} – ${labelDM(to)}`;

  const exportEvents = () => {
    const lines = ["დრო,ტიპი,სამიზნე,მომხმარებელი"];
    // Quote every text cell and stop spreadsheets from reading user input as a formula.
    const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? "'" + v : v).replace(/"/g, '""')}"`;
    (events.data || []).forEach(e => lines.push([evTime(e.ts), kindLabel(e.kind), cell(e.target), cell(e.viewer)].join(",")));
    downloadCsv(`events-${from}_${to}.csv`, lines.join("\n"));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" />ანალიტიკა</h1>
          <p className="text-sm text-muted-foreground mt-1">{periodLabel} · {labelDM(from)}{from !== to && `–${labelDM(to)}`}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {PRESETS.map(p => (
              <button key={p.k} onClick={() => setPreset(p.k)}
                className={`whitespace-nowrap px-2 sm:px-3 py-1.5 text-sm rounded-md transition-colors ${preset === p.k ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
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
          <button onClick={() => overview.data && downloadCsv(`analytics-${from}_${to}.csv`, dailyCsv(overview.data.daily))} disabled={!overview.data}
            title="დღიური ჯამები" className="flex disabled:opacity-50 items-center gap-1.5 h-9 px-3 rounded-lg border text-sm hover:bg-muted transition-colors">
            <Download className="h-4 w-4" />CSV
          </button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">მიმოხილვა</TabsTrigger>
          <TabsTrigger value="activity">აქტივობა</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          {overview.isError ? (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>მიმოხილვა ვერ ჩაიტვირთა. თუ ეს პირველი გაშვებაა, ბაზაში გასაშვებია მიგრაცია `20261127160000_admin_overview.sql`.</span>
            </div>
          ) : !overview.data ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>
          ) : <OverviewTab data={overview.data} />}
        </TabsContent>

        <TabsContent value="activity" className="pt-4">
          {/* DRILL-DOWN: who viewed / called what */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2"><ListFilter className="h-5 w-5 text-primary" />დეტალური აქტივობა</CardTitle>
                <button onClick={exportEvents} className="ml-auto flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs hover:bg-muted"><Download className="h-3.5 w-3.5" />CSV</button>
                <div className="flex gap-1 bg-muted rounded-lg p-0.5 text-xs">
                  {([["all", "ყველა"], ["view", "ნახვები"], ["call", "დაჭერები"], ["search", "ძიებები"]] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setEvFilter(k)} className={`px-2.5 py-1 rounded-md transition-colors ${evFilter === k ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}>{l}</button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {events.isLoading ? <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div> :
                filteredEvents.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">ამ პერიოდში აქტივობა არ ყოფილა</p> : (
                  <div className="max-h-[420px] overflow-y-auto overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-background"><tr className="text-left text-xs text-muted-foreground border-b">
                        <th className="py-2 px-3 font-medium">დრო</th><th className="py-2 px-2 font-medium">ტიპი</th>
                        <th className="py-2 px-2 font-medium">სამიზნე</th><th className="py-2 px-3 font-medium">მომხმარებელი</th>
                      </tr></thead>
                      <tbody>
                        {filteredEvents.slice(0, 200).map((e, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/40">
                            <td className="py-1.5 px-3 whitespace-nowrap text-muted-foreground">{evTime(e.ts)}</td>
                            <td className="py-1.5 px-2 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${e.kind === "ნახვა" ? "bg-blue-50 text-blue-700" : e.kind === "ძიება" ? "bg-purple-50 text-purple-700" : "bg-green-50 text-green-700"}`}>
                                {e.kind === "ნახვა" ? <Eye className="h-3 w-3" /> : e.kind === "ძიება" ? <Search className="h-3 w-3" /> : <Phone className="h-3 w-3" />}{kindLabel(e.kind)}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 max-w-[260px]">
                              <div className="flex items-center gap-1.5">
                                {e.link ? (
                                  <Link to={e.link} target="_blank" className="text-primary hover:underline truncate">{e.target}</Link>
                                ) : <span className="truncate">{e.target}</span>}
                                {e.link?.startsWith("/service/") && (
                                  <button
                                    onClick={() => setActiveSvc({ id: Number(e.link!.split("/").pop()), name: e.target })}
                                    title="სერვისის ანალიტიკა"
                                    className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                                  >
                                    <ChartNoAxesColumn className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-1.5 px-3 truncate max-w-[160px] text-muted-foreground">{e.viewer}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="text-xs text-muted-foreground pt-2 text-center">ეს არის მხოლოდ პერიოდის ბოლო {EVENT_LIMIT} მოვლენა (ცხრილში ჩანს 200-მდე). ჯამები „მიმოხილვაში“ სრულია.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Per-service drill-down */}
      <Dialog open={!!activeSvc} onOpenChange={(o) => !o && setActiveSvc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="pr-6 text-base leading-snug">{activeSvc?.name}</DialogTitle>
            <p className="text-xs text-muted-foreground">სერვისის ანალიტიკა · {periodLabel}</p>
          </DialogHeader>
          {svcActivity.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "ნახვები", value: svcViews, color: "text-blue-600", icon: Eye },
                  { label: "დაჭერები", value: svcCalls, color: "text-green-600", icon: Phone },
                  { label: "კონვერსია", value: svcConv == null ? "—" : `${svcConv}%`, color: "text-purple-600", icon: Repeat },
                ].map((s, i) => (
                  <div key={i} className="rounded-lg border p-3 text-center">
                    <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
                    <div className="text-xl font-bold">{s.value}</div>
                    <div className="text-[11px] text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
              {activeSvc && (
                <Link to={`/service/${activeSvc.id}`} target="_blank" className="text-xs text-primary hover:underline">სერვისის გვერდი →</Link>
              )}
              <div className="max-h-[300px] overflow-y-auto rounded-lg border mt-1">
                {(svcActivity.data || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">ამ პერიოდში აქტივობა არ ყოფილა</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background"><tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="py-2 px-3 font-medium">დრო</th><th className="py-2 px-2 font-medium">ტიპი</th><th className="py-2 px-3 font-medium">მომხმარებელი</th>
                    </tr></thead>
                    <tbody>
                      {(svcActivity.data || []).map((e, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-1.5 px-3 whitespace-nowrap text-muted-foreground">{evTime(e.ts)}</td>
                          <td className="py-1.5 px-2 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${e.kind === "ნახვა" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
                              {e.kind === "ნახვა" ? <Eye className="h-3 w-3" /> : <Phone className="h-3 w-3" />}{kindLabel(e.kind)}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 truncate max-w-[180px] text-muted-foreground">{e.viewer}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAnalytics;
