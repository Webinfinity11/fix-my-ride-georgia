import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3, Mail, FileText, Package, Truck, ArrowRight,
  UserPlus, Wrench, TrendingUp,
} from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import AdminStats from "./AdminStats";
import ServicePhoneViewsStats from "./ServicePhoneViewsStats";
import { useOldLeadsCount, useNewRequestsCount } from "@/hooks/useAutoLeads";
import { useNewPartsOrdersCount } from "@/hooks/usePartsOrders";
import { useNewEvacuatorRequestsCount } from "@/hooks/useEvacuatorRequests";

const ROLE_LABELS: Record<string, string> = { customer: "მომხმარებელი", mechanic: "ხელოსანი", admin: "ადმინი" };
const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3.6e6);
  if (h < 1) return "ახლახ";
  if (h < 24) return `${h} სთ წინ`;
  return `${Math.floor(h / 24)} დღის წინ`;
};

const AdminDashboard = () => {
  const { data: leads = 0 } = useOldLeadsCount();
  const { data: requests = 0 } = useNewRequestsCount();
  const { data: parts = 0 } = useNewPartsOrdersCount();
  const { data: evac = 0 } = useNewEvacuatorRequestsCount();

  const actions = [
    { label: "ლიდები", count: leads, to: "/dashboard/admin/leads", icon: Mail },
    { label: "მოთხოვნები", count: requests, to: "/dashboard/admin/requests", icon: FileText },
    { label: "ნაწილების შეკვეთები", count: parts, to: "/dashboard/admin/parts-orders", icon: Package },
    { label: "ევაკუატორი", count: evac, to: "/dashboard/admin/evacuator-requests", icon: Truck },
  ];
  const pendingTotal = leads + requests + parts + evac;

  const { data: recentUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-recent-users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles")
        .select("id, first_name, last_name, role, created_at")
        .order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
  });

  const { data: recentServices, isLoading: servicesLoading } = useQuery({
    queryKey: ["admin-recent-services"],
    queryFn: async () => {
      const { data } = await supabase.from("mechanic_services")
        .select("id, name, city, created_at")
        .order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
  });

  const { data: chartData } = useQuery({
    queryKey: ["admin-signups-14d"],
    queryFn: async () => {
      // 14 UTC calendar-day buckets ending today (inclusive); consistent with UTC created_at.
      const DAY = 864e5;
      const t = new Date();
      const startToday = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
      const startBucket = startToday - 13 * DAY;
      const { data } = await supabase.from("profiles").select("created_at").gte("created_at", new Date(startBucket).toISOString());
      const days: { key: string; label: string; count: number }[] = [];
      for (let i = 0; i < 14; i++) {
        const d = new Date(startBucket + i * DAY);
        days.push({ key: d.toISOString().slice(0, 10), label: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`, count: 0 });
      }
      const map = Object.fromEntries(days.map(d => [d.key, d]));
      (data || []).forEach(r => { const k = String(r.created_at).slice(0, 10); if (map[k]) map[k].count++; });
      return days;
    },
  });

  const signupsTotal = (chartData || []).reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          მიმოხილვა
        </h1>
        <p className="text-sm text-muted-foreground mt-1">პლატფორმის მდგომარეობა ერთ ეკრანზე</p>
      </div>

      {/* Action needed */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-semibold">ყურადღება სჭირდება</h2>
          {pendingTotal > 0 && <Badge variant="destructive" className="h-5">{pendingTotal}</Badge>}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map((a) => {
            const has = a.count > 0;
            return (
              <Link key={a.to} to={a.to}
                className={`group rounded-xl border p-4 transition-colors ${has ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10" : "bg-card hover:bg-muted/50"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${has ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                    <a.icon className="h-4 w-4" />
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className={`text-2xl font-bold ${has ? "text-destructive" : ""}`}>{a.count}</div>
                <div className="text-xs text-muted-foreground">{a.label}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Stats */}
      <AdminStats />

      {/* Signups chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />რეგისტრაციები (14 დღე)</span>
            <span className="text-sm font-normal text-muted-foreground">სულ {signupsTotal}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData || []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={1} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                  labelFormatter={(l) => `${l}`} formatter={(v) => [`${v}`, "რეგისტრაცია"]} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#sg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-blue-600" />ახალი მომხმარებლები</span>
              <Link to="/dashboard/admin/users" className="text-xs text-primary hover:underline">ყველა</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {usersLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
              : (recentUsers || []).map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.first_name} {u.last_name}</p>
                    <p className="text-xs text-muted-foreground">{ROLE_LABELS[u.role] || u.role}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{timeAgo(u.created_at)}</span>
                </div>
              ))}
            {!usersLoading && (recentUsers || []).length === 0 && <p className="text-sm text-muted-foreground py-3">ცარიელია</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2"><Wrench className="h-5 w-5 text-green-600" />ახალი სერვისები</span>
              <Link to="/dashboard/admin/service-details" className="text-xs text-primary hover:underline">ყველა</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {servicesLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
              : (recentServices || []).map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.city || "—"}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{timeAgo(s.created_at)}</span>
                </div>
              ))}
            {!servicesLoading && (recentServices || []).length === 0 && <p className="text-sm text-muted-foreground py-3">ცარიელია</p>}
          </CardContent>
        </Card>
      </div>

      <ServicePhoneViewsStats />
    </div>
  );
};

export default AdminDashboard;
