import { useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clock, Eye, Phone, Repeat, Search, TrendingDown, TrendingUp, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  allClicks, change, conversion, mechanicClicks, Overview, OverviewDay, profileViews, Ranked,
  series, serviceClicks, serviceViews, total, type Metric,
} from "./overview";

const BLUE = "#2563eb";
const GREEN = "#15803d";
const MUTED = "#94a3b8";
const num = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");
const tooltipStyle = { borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 };

const Delta = ({ value, unit }: { value: number | null; unit: string }) => {
  if (value === null) return <span className="text-xs text-muted-foreground">—</span>;
  const Icon = value < 0 ? TrendingDown : TrendingUp;
  const tone = value === 0 ? "text-muted-foreground" : value > 0 ? "text-green-700" : "text-red-600";
  return (
    <span className={`flex items-center gap-0.5 whitespace-nowrap text-xs font-medium ${tone}`}>
      <Icon className="h-3 w-3" />{value > 0 ? "+" : ""}{value}{unit}
    </span>
  );
};

type KpiProps = {
  icon: typeof Eye; label: string; value: string; delta: number | null; unit?: string;
  note: string; detail?: string; spark: number[]; color: string;
};

const Kpi = ({ icon: Icon, label, value, delta, unit = "%", note, detail, spark, color }: KpiProps) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-4 w-4 shrink-0" />{label}</span>
        <Delta value={delta} unit={unit} />
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{note}</div>
      {detail && <div className="text-[11px] text-muted-foreground">{detail}</div>}
      <div className="mt-2 h-9" aria-hidden="true">
        {spark.length > 1 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark.map((v) => ({ v }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={color} fillOpacity={0.1} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </CardContent>
  </Card>
);

const Trend = ({ title, days, metric, weekly, color }: { title: string; days: OverviewDay[]; metric: Metric; weekly: boolean; color: string }) => {
  const data = series(days, metric, weekly);
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={16} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="current" name="ეს პერიოდი" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.1} />
              <Line type="monotone" dataKey="previous" name="წინა პერიოდი" stroke={MUTED} strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const TopList = ({ title, icon: Icon, items, empty, link }: { title: string; icon: typeof Eye; items: Ranked[]; empty: string; link: (item: Ranked) => string }) => (
  <Card>
    <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Icon className="h-4 w-4 text-primary" />{title}</CardTitle></CardHeader>
    <CardContent className="p-0">
      {items.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p> : (
        <ol className="max-h-[300px] overflow-y-auto px-4 pb-3">
          {items.map((item, i) => (
            <li key={item.id ?? item.name} className="flex items-center gap-3 border-b py-1.5 last:border-0">
              <span className="w-5 text-center text-sm font-semibold text-muted-foreground">{i + 1}</span>
              <Link to={link(item)} target="_blank" className="flex-1 truncate text-sm hover:text-primary hover:underline">{item.name}</Link>
              <span className="text-sm font-semibold tabular-nums">{num(item.n)}</span>
            </li>
          ))}
        </ol>
      )}
    </CardContent>
  </Card>
);

const OverviewTab = ({ data }: { data: Overview }) => {
  const [grouping, setGrouping] = useState<"day" | "week">("day");
  const days = data.daily;
  const canGroup = days.length >= 14;
  const weekly = canGroup && grouping === "week";

  const stat = (metric: Metric) => {
    const current = total(days, metric);
    const previous = total(days, metric, true);
    return { current, previous, delta: change(current, previous), spark: days.map((d) => metric(d, false)) };
  };
  const views = stat(serviceViews);
  const clicks = stat(allClicks);
  const profiles = stat(profileViews);
  const rate = conversion(total(days, serviceClicks), views.current);
  const previousRate = conversion(total(days, serviceClicks, true), views.previous);
  const before = (n: number) => `წინა პერიოდი: ${num(n)}`;

  return (
    <div className="space-y-6">
      {data.filtered && data.filtered.views + data.filtered.clicks > 0 && (
        <p className="text-xs text-muted-foreground">
          ავტომატურ ტრაფიკად ჩაითვალა და ციფრებში არ შედის: {num(data.filtered.views)} ნახვა, {num(data.filtered.clicks)} დაჭერა
          (ბოტისთვის დამახასიათებელი ქცევა: ძალიან სწრაფი ან მასობრივი შემოვლა).
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Eye} label="სერვისის ნახვები" value={num(views.current)} delta={views.delta} note={before(views.previous)} spark={views.spark} color={BLUE} />
        <Kpi icon={Phone} label="ნომერზე დაჭერა" value={num(clicks.current)} delta={clicks.delta} note={before(clicks.previous)}
          detail={`განცხადება ${num(total(days, serviceClicks))} · პროფილი ${num(total(days, mechanicClicks))}`} spark={clicks.spark} color={GREEN} />
        <Kpi icon={Repeat} label="კონვერსია" value={rate === null ? "—" : `${rate}%`}
          delta={rate === null || previousRate === null ? null : Math.round((rate - previousRate) * 10) / 10} unit=" პ.პ."
          note={previousRate === null ? "წინა პერიოდი: —" : `წინა პერიოდი: ${previousRate}%`} detail="განცხადების ნახვა → ნომერზე დაჭერა"
          spark={days.map((d) => conversion(d.service_clicks, d.service_views) ?? 0)} color={BLUE} />
        <Kpi icon={UserRound} label="პროფილის ნახვები" value={num(profiles.current)} delta={profiles.delta} note={before(profiles.previous)} spark={profiles.spark} color={BLUE} />
      </div>

      {canGroup && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {weekly && days.length % 7 !== 0 && <span className="text-xs text-muted-foreground">ბოლო მონაკვეთი {days.length % 7} დღეა, ამიტომ დაბალია</span>}
          <div className="flex gap-1 rounded-lg bg-muted p-0.5 text-xs">
            {([["day", "დღეებით"], ["week", "კვირებით"]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setGrouping(key)} aria-pressed={grouping === key}
                className={`rounded-md px-2.5 py-1 ${grouping === key ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}>{label}</button>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        <Trend title="სერვისის ნახვები" days={days} metric={serviceViews} weekly={weekly} color={BLUE} />
        <Trend title="ნომერზე დაჭერა" days={days} metric={allClicks} weekly={weekly} color={GREEN} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TopList title="ყველაზე ნახვადი" icon={Eye} items={data.top_viewed} empty="ამ პერიოდში ნახვა არ ყოფილა" link={(s) => `/service/${s.id}`} />
        <TopList title="ყველაზე მეტი დაჭერა" icon={Phone} items={data.top_clicked} empty="ამ პერიოდში დაჭერა არ ყოფილა" link={(s) => `/service/${s.id}`} />
        <TopList title="რას ეძებენ" icon={Search} items={data.top_searches} empty="ამ პერიოდში ძიება არ ყოფილა" link={(s) => `/service-search?q=${encodeURIComponent(s.name)}`} />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4 text-primary" />რომელ საათზე აჭერენ ნომერს (თბილისის დრო)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hours.map((n, h) => ({ hour: `${h}:00`, n }))} margin={{ top: 5, right: 5, left: -10, bottom: 0 }} barCategoryGap={2}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
                <Bar dataKey="n" name="დაჭერა" fill={GREEN} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
