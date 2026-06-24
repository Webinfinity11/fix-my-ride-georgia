import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Car,
  PenSquare,
  Wrench,
  Calendar,
  LogOut,
  Settings,
  Shield,
  Users,
  Cog,
  MessageCircle,
  CalendarCog,
  Bookmark,
  Crown,
  MessageSquare,
  Fuel,
  Award,
  Search,
  Megaphone,
  Briefcase,
  FileText,
  Mail,
  Package,
  Truck,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useOldLeadsCount, useNewRequestsCount } from "@/hooks/useAutoLeads";
import { useNewPartsOrdersCount } from "@/hooks/usePartsOrders";
import { useNewEvacuatorRequestsCount } from "@/hooks/useEvacuatorRequests";

const DashboardSidebar = () => {
  const { user, signOut } = useAuth();
  const { data: oldLeadsCount = 0 } = useOldLeadsCount();
  const { data: newRequestsCount = 0 } = useNewRequestsCount();
  const { data: newPartsOrdersCount = 0 } = useNewPartsOrdersCount();
  const { data: newEvacuatorRequestsCount = 0 } = useNewEvacuatorRequestsCount();

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 md:px-4 py-2 rounded-md transition-colors ${
      isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted-foreground/10"
    }`;

  // Grouped admin navigation — pending/action items first, then content/catalog/management.
  const adminGroups: { label: string | null; items: { to: string; icon: typeof Shield; label: string; badge?: number }[] }[] = [
    { label: null, items: [
      { to: "/dashboard/admin", icon: Shield, label: "მიმოხილვა" },
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
    <div className="w-full md:w-64 bg-background rounded-lg shadow-sm p-4 md:p-6 h-fit">
      <div className="mb-4 md:mb-6">
        <h2 className="font-semibold text-lg md:text-xl">მენიუ</h2>
      </div>

      <nav className="space-y-1">
        <Accordion type="single" collapsible className="w-full" defaultValue="main">
          <AccordionItem value="main" className="border-none">
            <AccordionTrigger className="py-2 px-1 hover:no-underline text-sm font-semibold text-muted-foreground">
              ძირითადი
            </AccordionTrigger>
            <AccordionContent className="space-y-1 pb-2">
              <NavLink to="/dashboard" end className={navLinkClasses}>
                <Settings size={18} />
                <span className="text-sm md:text-base">მთავარი</span>
              </NavLink>

              <NavLink to="/dashboard/profile" className={navLinkClasses}>
                <User size={18} />
                <span className="text-sm md:text-base">პროფილი</span>
              </NavLink>

              {user?.role === "customer" && (
                <NavLink to="/dashboard/cars" className={navLinkClasses}>
                  <Car size={18} />
                  <span className="text-sm md:text-base">ჩემი ავტომობილები</span>
                </NavLink>
              )}

              {user?.role === "mechanic" && (
                <>
                  <NavLink
                    to="/dashboard/services"
                    className={({ isActive }) => {
                      const isServicesPage = window.location.pathname === '/add-service' || isActive;
                      return `flex items-center gap-2 px-3 md:px-4 py-2 rounded-md transition-colors ${
                        isServicesPage ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted-foreground/10"
                      }`;
                    }}
                  >
                    <Wrench size={18} />
                    <span className="text-sm md:text-base">სერვისები</span>
                  </NavLink>

                  <NavLink to="/dashboard/vacancies" className={navLinkClasses}>
                    <Briefcase size={18} />
                    <span className="text-sm md:text-base">ვაკანსიები</span>
                  </NavLink>
                </>
              )}

              <NavLink to="/dashboard/bookings" className={navLinkClasses}>
                <Calendar size={18} />
                <span className="text-sm md:text-base">ჯავშნები</span>
              </NavLink>

              {(user?.role === "customer" || user?.role === "mechanic") && (
                <>
                  <NavLink to="/dashboard/saved-services" className={navLinkClasses}>
                    <Bookmark size={18} />
                    <span className="text-sm md:text-base">შენახული სერვისები</span>
                  </NavLink>
                  
                  <NavLink to="/dashboard/saved-posts" className={navLinkClasses}>
                    <MessageSquare size={18} />
                    <span className="text-sm md:text-base">შენახული პოსტები</span>
                  </NavLink>
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          {user?.role === "admin" && (
            <AccordionItem value="admin" className="border-none">
              <AccordionTrigger className="py-2 px-1 hover:no-underline text-sm font-semibold text-muted-foreground">
                ადმინისტრაცია
              </AccordionTrigger>
              <AccordionContent className="space-y-1 pb-2">
                {adminGroups.map((group, gi) => (
                  <div key={gi} className={group.label ? "pt-1.5" : ""}>
                    {group.label && (
                      <p className="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                        {group.label}
                      </p>
                    )}
                    {group.items.map((item) => (
                      <NavLink key={item.to} to={item.to} end={item.to === "/dashboard/admin"} className={navLinkClasses}>
                        <item.icon size={18} className="shrink-0" />
                        <span className="text-sm md:text-base flex-1">{item.label}</span>
                        {item.badge ? (
                          <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center px-1.5 text-xs">
                            {item.badge}
                          </Badge>
                        ) : null}
                      </NavLink>
                    ))}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-2 px-3 md:px-4 py-2 rounded-md text-destructive hover:bg-destructive/10 transition-colors mt-4"
        >
          <LogOut size={18} />
          <span className="text-sm md:text-base">გასვლა</span>
        </button>
      </nav>
    </div>
  );
};

export default DashboardSidebar;
