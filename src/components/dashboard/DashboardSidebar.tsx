import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Car,
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
  MapIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const DashboardSidebar = () => {
  const { user, signOut } = useAuth();

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 md:px-4 py-2 rounded-md transition-colors ${
      isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted-foreground/10"
    }`;

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
              )}

              <NavLink to="/dashboard/bookings" className={navLinkClasses}>
                <Calendar size={18} />
                <span className="text-sm md:text-base">ჯავშნები</span>
              </NavLink>

              {(user?.role === "customer" || user?.role === "mechanic") && (
                <NavLink to="/dashboard/saved-services" className={navLinkClasses}>
                  <Bookmark size={18} />
                  <span className="text-sm md:text-base">შენახული სერვისები</span>
                </NavLink>
              )}
            </AccordionContent>
          </AccordionItem>

          {user?.role === "admin" && (
            <AccordionItem value="admin" className="border-none">
              <AccordionTrigger className="py-2 px-1 hover:no-underline text-sm font-semibold text-muted-foreground">
                ადმინისტრაცია
              </AccordionTrigger>
              <AccordionContent className="space-y-1 pb-2">
                <NavLink to="/dashboard/admin" className={navLinkClasses}>
                  <Shield size={18} />
                  <span className="text-sm md:text-base">მიმოხილვა</span>
                </NavLink>

                <NavLink to="/dashboard/admin/service-details" className={navLinkClasses}>
                  <Cog size={18} />
                  <span className="text-sm md:text-base">სერვისის დეტალები</span>
                </NavLink>

                <NavLink to="/dashboard/admin/chat-management" className={navLinkClasses}>
                  <MessageCircle size={18} />
                  <span className="text-sm md:text-base">ჩატის მართვა</span>
                </NavLink>

                <NavLink to="/dashboard/admin/laundries" className={navLinkClasses}>
                  <Settings size={18} />
                  <span className="text-sm md:text-base">სამრეცხაოები</span>
                </NavLink>

                <NavLink to="/dashboard/admin/booking-management" className={navLinkClasses}>
                  <CalendarCog size={18} />
                  <span className="text-sm md:text-base">ჯავშნების მართვა</span>
                </NavLink>

                <NavLink to="/dashboard/admin/vip-management" className={navLinkClasses}>
                  <Crown size={18} />
                  <span className="text-sm md:text-base">VIP მართვა</span>
                </NavLink>

                <NavLink to="/dashboard/admin/community" className={navLinkClasses}>
                  <MessageSquare size={18} />
                  <span className="text-sm md:text-base">Community მართვა</span>
                </NavLink>

                <NavLink to="/dashboard/admin/fuel-importers" className={navLinkClasses}>
                  <Fuel size={18} />
                  <span className="text-sm md:text-base">საწვავის იმპორტიორები</span>
                </NavLink>

                <NavLink to="/dashboard/admin/fuel-brands" className={navLinkClasses}>
                  <Award size={18} />
                  <span className="text-sm md:text-base">საწვავის ბრენდები</span>
                </NavLink>

                <NavLink to="/dashboard/admin/users" className={navLinkClasses}>
                  <Users size={18} />
                  <span className="text-sm md:text-base">მომხმარებლები</span>
                </NavLink>

                <NavLink to="/dashboard/admin/saved-services" className={navLinkClasses}>
                  <Bookmark size={18} />
                  <span className="text-sm md:text-base">შენახული სერვისების მართვა</span>
                </NavLink>

                <NavLink to="/dashboard/admin/seo" className={navLinkClasses}>
                  <Search size={18} />
                  <span className="text-sm md:text-base">SEO მართვა</span>
                </NavLink>

                <NavLink to="/dashboard/admin/banners" className={navLinkClasses}>
                  <Megaphone size={18} />
                  <span className="text-sm md:text-base">რეკლამების მართვა</span>
                </NavLink>

                <NavLink to="/dashboard/admin/sitemap" className={navLinkClasses}>
                  <MapIcon size={18} />
                  <span className="text-sm md:text-base">Sitemap მართვა</span>
                </NavLink>
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
