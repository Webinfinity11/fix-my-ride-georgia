import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  LayoutDashboard,
  Car,
  Wrench,
  BookmarkCheck,
  Calendar,
  Settings,
  HelpCircle,
  Bell,
  LogOut,
  Shield,
  MessageCircle,
  Plus,
  Home,
  Map,
  Droplet,
  Fuel,
  Phone,
  Info,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface MobileDrawerMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const MobileDrawerMenu = ({ children, open, onOpenChange }: MobileDrawerMenuProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Site menu items
  const siteMenuItems = [
    { icon: Home, label: 'მთავარი', path: '/' },
    { icon: Wrench, label: 'სერვისები', path: '/services' },
    { icon: Map, label: 'რუკა', path: '/map' },
    { icon: Droplet, label: 'სამრეცხაო', path: '/laundries' },
    { icon: Fuel, label: 'საწვავი', path: '/fuel-importers' },
    { icon: MessageCircle, label: 'ჩატი', path: '/chat' },
    { icon: Phone, label: 'კონტაქტი', path: '/contact' },
    { icon: Info, label: 'ჩვენ შესახებ', path: '/about' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('წარმატებით გამოხვედით');
      navigate('/');
      onOpenChange?.(false);
    } catch (error) {
      toast.error('გამოსვლა ვერ მოხერხდა');
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onOpenChange?.(false);
  };

  // If not logged in, show login prompt with site menu
  if (!user) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent className="h-[75vh] px-4 pb-[90px]">
          {/* Auth Buttons - Horizontal Layout */}
          <div className="grid grid-cols-2 gap-3 p-4 border-b">
            <Button onClick={() => handleNavigation('/login')} size="lg">
              შესვლა
            </Button>
            <Button onClick={() => handleNavigation('/register')} variant="outline" size="lg">
              რეგისტრაცია
            </Button>
          </div>

          {/* Site Menu */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2">
                საიტის მენიუ
              </p>
              <div className="space-y-1">
                {siteMenuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-muted transition-colors"
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  const getRoleLabel = () => {
    switch (user.role) {
      case 'admin':
        return 'ადმინისტრატორი';
      case 'mechanic':
        return 'მექანიკოსი';
      default:
        return 'მომხმარებელი';
    }
  };

  const getRoleBadgeVariant = () => {
    switch (user.role) {
      case 'admin':
        return 'destructive';
      case 'mechanic':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="h-[85vh] px-4 pb-[90px]">
        
        <Tabs defaultValue="site" className="flex flex-col h-full">
          {/* Tabs Header */}
          <TabsList className={`grid ${user.role === 'admin' ? 'grid-cols-3' : 'grid-cols-2'} w-full mt-4`}>
            <TabsTrigger value="site">მენიუ</TabsTrigger>
            <TabsTrigger value="profile">პროფილი</TabsTrigger>
            {user.role === 'admin' && (
              <TabsTrigger value="admin">ადმინი</TabsTrigger>
            )}
          </TabsList>

          {/* Tab 1: Site Menu */}
          <TabsContent value="site" className="flex-1 overflow-y-auto mt-2">
            <div className="space-y-1 py-2">
              {siteMenuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-muted transition-colors"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Tab 2: Profile Menu */}
          <TabsContent value="profile" className="flex-1 overflow-y-auto mt-2">
            {/* Profile Header */}
            <div className="flex items-center gap-3 p-4 border-b mb-2">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-lg">
                  {user.firstName} {user.lastName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getRoleBadgeVariant()} className="text-xs">
                    {getRoleLabel()}
                  </Badge>
                  {user.isVerified && (
                    <Badge variant="outline" className="text-xs">✓ დადასტურებული</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Navigation */}
            <div className="space-y-1 py-2">
              <button
                onClick={() => handleNavigation('/dashboard')}
                className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-muted transition-colors"
              >
                <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Dashboard</span>
              </button>

              <button
                onClick={() => handleNavigation('/dashboard/profile')}
                className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-muted transition-colors"
              >
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">პროფილი</span>
              </button>

              {user.role === 'customer' && (
                <button
                  onClick={() => handleNavigation('/dashboard/cars')}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-muted transition-colors"
                >
                  <Car className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">ჩემი მანქანები</span>
                </button>
              )}

              {user.role === 'mechanic' && (
                <>
                  <button
                    onClick={() => handleNavigation('/dashboard/services')}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-muted transition-colors"
                  >
                    <Wrench className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">ჩემი სერვისები</span>
                  </button>
                  <button
                    onClick={() => handleNavigation('/add-service')}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-muted transition-colors"
                  >
                    <Plus className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">სერვისის დამატება</span>
                  </button>
                </>
              )}

              <button
                onClick={() => handleNavigation('/dashboard/bookings')}
                className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-muted transition-colors"
              >
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">ჯავშნები</span>
              </button>

              <button
                onClick={() => handleNavigation('/dashboard/saved-services')}
                className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-muted transition-colors"
              >
                <BookmarkCheck className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">შენახული სერვისები</span>
              </button>

              <Separator className="my-4" />

              <button
                onClick={() => handleNavigation('/dashboard/settings')}
                className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-muted transition-colors"
              >
                <Settings className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">პარამეტრები</span>
              </button>

              <button
                onClick={() => handleNavigation('/contact')}
                className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-muted transition-colors"
              >
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">დახმარება</span>
              </button>
            </div>
          </TabsContent>

          {/* Tab 3: Admin Menu (only for admins) */}
          {user.role === 'admin' && (
            <TabsContent value="admin" className="flex-1 overflow-y-auto mt-2">
              <div className="space-y-1 py-2">
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    ადმინისტრაციის პანელი
                  </p>
                </div>
                <button
                  onClick={() => handleNavigation('/dashboard/admin')}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-muted transition-colors"
                >
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Admin Dashboard</span>
                </button>
              </div>
            </TabsContent>
          )}

          {/* Footer: Logout Button (outside tabs, always visible) */}
          <div className="border-t mt-auto">
            <div className="p-4">
              <Button
                onClick={handleSignOut}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <LogOut className="h-5 w-5 mr-2" />
                გამოსვლა
              </Button>
            </div>
          </div>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
};
