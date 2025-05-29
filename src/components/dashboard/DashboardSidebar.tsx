
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Car,
  Wrench,
  Calendar,
  LogOut,
  Settings,
} from "lucide-react";

const DashboardSidebar = () => {
  const { user, signOut } = useAuth();

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2 rounded-md ${
      isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted-foreground/10"
    }`;

  return (
    <div className="w-64 bg-background rounded-lg shadow-sm p-6 h-fit">
      <div className="mb-6">
        <h2 className="font-semibold text-xl">მენიუ</h2>
      </div>

      <nav className="space-y-1">
        <NavLink to="/dashboard" end className={navLinkClasses}>
          <Settings size={18} />
          <span>მთავარი</span>
        </NavLink>

        <NavLink to="/dashboard/profile" className={navLinkClasses}>
          <User size={18} />
          <span>პროფილი</span>
        </NavLink>

        {user?.role === "customer" && (
          <NavLink to="/dashboard/cars" className={navLinkClasses}>
            <Car size={18} />
            <span>ჩემი ავტომობილები</span>
          </NavLink>
        )}

        {user?.role === "mechanic" && (
          <NavLink 
            to="/dashboard/services" 
            className={({ isActive }) => {
              // Also highlight this link when on add-service page
              const isServicesPage = window.location.pathname === '/add-service' || isActive;
              return `flex items-center gap-2 px-4 py-2 rounded-md ${
                isServicesPage ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted-foreground/10"
              }`;
            }}
          >
            <Wrench size={18} />
            <span>სერვისები</span>
          </NavLink>
        )}

        <NavLink to="/dashboard/bookings" className={navLinkClasses}>
          <Calendar size={18} />
          <span>ჯავშნები</span>
        </NavLink>

        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-2 px-4 py-2 rounded-md text-destructive hover:bg-destructive/10"
        >
          <LogOut size={18} />
          <span>გასვლა</span>
        </button>
      </nav>
    </div>
  );
};

export default DashboardSidebar;
