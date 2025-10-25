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
} from 'lucide-react';
import { toast } from 'sonner';

interface MobileDrawerMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const MobileDrawerMenu = ({ children, open, onOpenChange }: MobileDrawerMenuProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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

  // If not logged in, show login prompt
  if (!user) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent className="h-[50vh] px-4">
          <DrawerHeader className="text-center">
            <DrawerTitle>ავტორიზაცია საჭიროა</DrawerTitle>
            <DrawerDescription>
              გთხოვთ შეხვიდეთ სისტემაში ან დარეგისტრირდეთ
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-3 px-4 py-6">
            <Button onClick={() => handleNavigation('/login')} size="lg">
              შესვლა
            </Button>
            <Button onClick={() => handleNavigation('/register')} variant="outline" size="lg">
              რეგისტრაცია
            </Button>
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
      <DrawerContent className="h-[85vh] px-4">
        {/* Profile Header */}
        <DrawerHeader className="pb-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <DrawerTitle className="text-lg">
                {user.firstName} {user.lastName}
              </DrawerTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getRoleBadgeVariant()} className="text-xs">
                  {getRoleLabel()}
                </Badge>
                {user.isVerified && (
                  <Badge variant="outline" className="text-xs">
                    ✓ დადასტურებული
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Main Navigation */}
          <div className="space-y-1">
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

            <button
              onClick={() => handleNavigation('/chat')}
              className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-muted transition-colors"
            >
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">მესიჯები</span>
            </button>
          </div>

          <Separator className="my-4" />

          {/* Admin Section */}
          {user.role === 'admin' && (
            <>
              <div className="space-y-1">
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    ადმინისტრირება
                  </p>
                </div>
                <button
                  onClick={() => handleNavigation('/dashboard/admin')}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-muted transition-colors"
                >
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Admin Panel</span>
                </button>
              </div>
              <Separator className="my-4" />
            </>
          )}

          {/* Settings & Help */}
          <div className="space-y-1">
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
        </div>

        {/* Footer with Logout */}
        <DrawerFooter className="pt-4 border-t">
          <Button
            onClick={handleSignOut}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            <LogOut className="h-5 w-5 mr-2" />
            გამოსვლა
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
