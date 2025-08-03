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
  BarChart3,
  Users,
  Cog,
  MessageCircle,
  CalendarCog,
} from "lucide-react";

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
              // Also highlight this link when on add-service page
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

        {user?.role === "admin" && (
          <>
            <div className="border-t border-muted my-3 md:my-4"></div>
            <div className="mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                ადმინისტრაცია
              </span>
            </div>
            
            <NavLink to="/dashboard/admin" className={navLinkClasses}>
              <Shield size={18} />
              <span className="text-sm md:text-base">ადმიн პანელი</span>
            </NavLink>

            <NavLink to="/dashboard/admin/service-details" className={navLinkClasses}>
              <Cog size={18} />
              <span className="text-sm md:text-base">სერვისის დეტალები</span>
            </NavLink>

            <NavLink to="/dashboard/admin/chat-management" className={navLinkClasses}>
              <MessageCircle size={18} />
              <span className="text-sm md:text-base">ჩატის მართვა</span>
            </NavLink>

            <NavLink to="/dashboard/admin/booking-management" className={navLinkClasses}>
              <CalendarCog size={18} />
              <span className="text-sm md:text-base">ჯავშნების მართვა</span>
            </NavLink>

            <NavLink to="/dashboard/admin/stats" className={navLinkClasses}>
              <BarChart3 size={18} />
              <span className="text-sm md:text-base">სტატისტიკა</span>
            </NavLink>

            <NavLink to="/dashboard/admin/users" className={navLinkClasses}>
              <Users size={18} />
              <span className="text-sm md:text-base">მომხმარებლები</span>
            </NavLink>
          </>
        )}

        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-2 px-3 md:px-4 py-2 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm md:text-base">გასვლა</span>
        </button>
      </nav>
    </div>
  );
};

export default DashboardSidebar;
