
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Home, Search, Plus, MessageCircle, User, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MobileBottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getAddIcon = () => {
    if (user?.role === 'mechanic') {
      return { icon: Plus, path: '/add-service', label: 'სერვისის დამატება' };
    } else {
      return { icon: Car, path: '/dashboard/cars', label: 'მანქანის დამატება' };
    }
  };

  const addAction = getAddIcon();

  const navItems = [
    {
      icon: Home,
      path: '/',
      label: 'მთავარი'
    },
    {
      icon: Search,
      path: '/services',
      label: 'სერვისები'
    },
    {
      icon: addAction.icon,
      path: addAction.path,
      label: addAction.label,
      isSpecial: true
    },
    {
      icon: MessageCircle,
      path: '/chat',
      label: 'ჩატი'
    },
    {
      icon: User,
      path: '/dashboard',
      label: 'პროფილი'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200",
              item.isSpecial 
                ? "bg-primary text-white shadow-lg transform scale-110"
                : isActive(item.path)
                ? "text-primary bg-primary/10"
                : "text-gray-500 hover:text-primary"
            )}
          >
            <item.icon 
              className={cn(
                "transition-all duration-200",
                item.isSpecial 
                  ? "w-6 h-6" 
                  : "w-5 h-5"
              )} 
            />
            <span className={cn(
              "text-xs mt-1 font-medium",
              item.isSpecial && "hidden"
            )}>
              {!item.isSpecial && item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
