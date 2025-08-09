
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Home, Search, Plus, MessageCircle, User, Car, Grid3x3 } from 'lucide-react';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleAddClick = () => {
    if (!user) {
      navigate('/category');
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
      icon: Search,
      label: 'Services',
      path: '/services',
      onClick: () => navigate('/services')
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
      icon: User,
      label: 'Profile',
      path: '/dashboard',
      onClick: () => navigate('/dashboard')
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] md:hidden">
      <div className="bg-white border-t border-gray-200 rounded-t-3xl shadow-lg">
        <div className="flex items-center justify-around h-[70px] px-4">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = !item.isCenter && isActive(item.path);
            
            if (item.isCenter) {
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="flex flex-col items-center justify-center w-14 h-14 bg-primary rounded-full shadow-lg transform -translate-y-2 transition-all duration-200 hover:bg-primary-dark active:scale-95"
                >
                  <Icon className="h-6 w-6 text-white" />
                </button>
              );
            }

            return (
              <button
                key={index}
                onClick={item.onClick}
                className="flex flex-col items-center justify-center min-w-0 flex-1 py-2 transition-colors duration-200"
              >
                <Icon 
                  className={`h-6 w-6 mb-1 ${
                    active ? 'text-primary' : 'text-gray-400'
                  }`} 
                />
                <span 
                  className={`text-xs font-medium ${
                    active ? 'text-primary' : 'text-gray-400'
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
  );
};

export default MobileBottomNav;
