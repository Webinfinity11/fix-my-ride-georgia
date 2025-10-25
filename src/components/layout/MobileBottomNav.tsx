
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Home, Search, Plus, MessageCircle, User, Car, Grid3x3, Map, Menu } from 'lucide-react';
import { MobileDrawerMenu } from './MobileDrawerMenu';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleAddClick = () => {
    if (!user) {
      navigate('/services');
    } else if (user.role === 'mechanic') {
      navigate('/add-service');
    } else {
      navigate('/dashboard/cars');
    }
  };

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/',
      onClick: () => navigate('/')
    },
    {
      icon: Map,
      label: 'Map',
      path: '/map',
      onClick: () => navigate('/map')
    },
    {
      icon: !user ? Grid3x3 : (user.role === 'mechanic' ? Plus : Car),
      label: !user ? 'Categories' : 'Add',
      path: '',
      onClick: handleAddClick,
      isCenter: true
    },
    {
      icon: MessageCircle,
      label: 'Chats',
      path: '/chat',
      onClick: () => navigate('/chat')
    },
    {
      icon: Menu,
      label: 'Menu',
      path: '',
      onClick: () => setDrawerOpen(true),
      isMenu: true
    }
  ];

  return (
    <>
      <MobileDrawerMenu open={drawerOpen} onOpenChange={setDrawerOpen}>
        <span className="hidden" />
      </MobileDrawerMenu>
      
      <div className="fixed bottom-0 left-0 right-0 z-[9999] md:hidden">
        <div className="bg-background border-t border-border rounded-t-3xl shadow-lg">
          <div className="flex items-center justify-around h-[70px] px-4">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = !item.isCenter && !item.isMenu && isActive(item.path);
              
              if (item.isCenter) {
                return (
                  <button
                    key={index}
                    onClick={item.onClick}
                    aria-label={!user ? 'კატეგორიები' : (user.role === 'mechanic' ? 'სერვისის დამატება' : 'მანქანის დამატება')}
                    className="flex flex-col items-center justify-center w-14 h-14 bg-primary rounded-full shadow-lg transform -translate-y-2 transition-all duration-200 hover:opacity-90 active:scale-95"
                  >
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </button>
                );
              }

              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="flex flex-col items-center justify-center min-w-0 flex-1 py-2 transition-colors duration-200"
                  aria-label={item.label}
                >
                  <Icon 
                    className={`h-6 w-6 mb-1 transition-colors ${
                      active ? 'text-primary' : 'text-muted-foreground'
                    }`} 
                  />
                  <span 
                    className={`text-xs font-medium transition-colors ${
                      active ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileBottomNav;
