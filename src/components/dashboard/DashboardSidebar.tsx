import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  User, Car, PenSquare, Wrench, Calendar, LogOut, Settings, Shield, Users,
  Cog, MessageCircle, CalendarCog, Bookmark, Crown, MessageSquare, Fuel,
  Award, Search, Megaphone, Briefcase, FileText, Mail, Package, Truck, BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOldLeadsCount, useNewRequestsCount } from "@/hooks/useAutoLeads";
import { useNewPartsOrdersCount } from "@/hooks/usePartsOrders";
import { useNewEvacuatorRequestsCount } from "@/hooks/useEvacuatorRequests";

type IconType = typeof Shield;
type Item = { to: string; icon: IconType; label: string; badge?: number; end?: boolean; extraActive?: boolean };

const itemClass = (active: boolean) =>
  cn(
    "relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
    "before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r before:bg-primary before:transition-opacity",
    active
      ? "bg-primary/10 text-primary font-medium before:opacity-100"
      : "text-muted-foreground hover:bg-muted hover:text-foreground before:opacity-0",
  );

const NavItem = ({ to, icon: Icon, label, badge, end, extraActive }: Item) => (
  <NavLink to={to} end={end} className={({ isActive }) => itemClass(isActive || !!extraActive)}>
    <Icon size={18} className="shrink-0" />
    <span className="flex-1 truncate text-sm">{label}</span>
    {badge ? (
      <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center px-1.5 text-xs">{badge}</Badge>
    ) : null}
  </NavLink>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="px-3 pt-5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 first:pt-1">{children}</p>
);
const SubLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="px-3 pt-3 pb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/40">{children}</p>
);

const DashboardSidebar = () => {
  const { user, signOut } = useAuth();
  const { data: oldLeadsCount = 0 } = useOldLeadsCount();
  const { data: newRequestsCount = 0 } = useNewRequestsCount();
  const { data: newPartsOrdersCount = 0 } = useNewPartsOrdersCount();
  const { data: newEvacuatorRequestsCount = 0 } = useNewEvacuatorRequestsCount();

  const onAddService = typeof window !== "undefined" && window.location.pathname === "/add-service";

  const mainItems: Item[] = [
    { to: "/dashboard", icon: Settings, label: "მთავარი", end: true },
    { to: "/dashboard/profile", icon: User, label: "პროფილი" },
    ...(user?.role === "customer" ? [{ to: "/dashboard/cars", icon: Car, label: "ჩემი ავტომობილები" }] : []),
    ...(user?.role === "mechanic" ? [
      { to: "/dashboard/services", icon: Wrench, label: "სერვისები", extraActive: onAddService },
      { to: "/dashboard/vacancies", icon: Briefcase, label: "ვაკანსიები" },
    ] : []),
    { to: "/dashboard/bookings", icon: Calendar, label: "ჯავშნები" },
    ...((user?.role === "customer" || user?.role === "mechanic") ? [
      { to: "/dashboard/saved-services", icon: Bookmark, label: "შენახული სერვისები" },
      { to: "/dashboard/saved-posts", icon: MessageSquare, label: "შენახული პოსტები" },
    ] : []),
  ];

  const adminGroups: { label: string | null; items: Item[] }[] = [
    { label: null, items: [
      { to: "/dashboard/admin", icon: Shield, label: "მიმოხილვა", end: true },
      { to: "/dashboard/admin/analytics", icon: BarChart3, label: "ანალიტიკა" },
    ]},
    { label: "მოთხოვნები", items: [
      { to: "/dashboard/admin/leads", icon: Mail, label: "ლიდები", badge: oldLeadsCount },
      { to: "/dashboard/admin/requests", icon: FileText, label: "მოთხოვნები", badge: newRequestsCount },
      { to: "/dashboard/admin/parts-orders", icon: Package, label: "ნაწილების შეკვეთები", badge: newPartsOrdersCount },
      { to: "/dashboard/admin/evacuator-requests", icon: Truck, label: "ევაკუატორი", badge: newEvacuatorRequestsCount },
      { to: "/dashboard/admin/booking-management", icon: CalendarCog, label: "ჯავშნების მართვა" },
    ]},
    { label: "შინაარსი", items: [
      { to: "/dashboard/admin/service-details", icon: Cog, label: "სერვისები" },
      { to: "/dashboard/admin/blog", icon: PenSquare, label: "ბლოგი" },
      { to: "/dashboard/admin/banners", icon: Megaphone, label: "რეკლამები" },
      { to: "/dashboard/admin/seo", icon: Search, label: "SEO მართვა" },
      { to: "/dashboard/admin/community", icon: MessageSquare, label: "Community" },
    ]},
    { label: "კატალოგი", items: [
      { to: "/dashboard/admin/laundries", icon: Settings, label: "სამრეცხაოები" },
      { to: "/dashboard/admin/drives", icon: Car, label: "დრაივები" },
      { to: "/dashboard/admin/fuel-importers", icon: Fuel, label: "საწვავის იმპორტიორები" },
      { to: "/dashboard/admin/fuel-brands", icon: Award, label: "საწვავის ბრენდები" },
      { to: "/dashboard/admin/vip-management", icon: Crown, label: "VIP მართვა" },
    ]},
    { label: "მართვა", items: [
      { to: "/dashboard/admin/users", icon: Users, label: "მომხმარებლები" },
      { to: "/dashboard/admin/chat-management", icon: MessageCircle, label: "ჩატის მართვა" },
      { to: "/dashboard/admin/saved-services", icon: Bookmark, label: "შენახული სერვისები" },
    ]},
  ];

  return (
    <div className="w-full md:w-64 bg-background rounded-xl border border-border/60 shadow-sm p-3 h-fit">
      <nav className="space-y-0.5">
        <SectionLabel>ძირითადი</SectionLabel>
        {mainItems.map((it) => <NavItem key={it.to} {...it} />)}

        {user?.role === "admin" && (
          <>
            <SectionLabel>ადმინისტრაცია</SectionLabel>
            {adminGroups.map((group, gi) => (
              <div key={gi}>
                {group.label && <SubLabel>{group.label}</SubLabel>}
                {group.items.map((it) => <NavItem key={it.to} {...it} />)}
              </div>
            ))}
          </>
        )}
      </nav>

      <div className="mt-3 pt-3 border-t border-border/60">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={18} className="shrink-0" />
          <span>გასვლა</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardSidebar;
