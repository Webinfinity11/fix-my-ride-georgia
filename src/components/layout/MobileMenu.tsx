
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Menu, User, Plus, Settings, LogOut, MessageCircle, Home, Wrench, Info, Phone } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const MobileMenu = () => {
  const { user, signOut } = useAuth();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="text-left">
            <Link to="/" className="text-xl font-bold text-primary">
              FixUp
            </Link>
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full pt-6">
          {/* User Profile Section */}
          {user && (
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg mb-6">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.role === 'mechanic' ? 'მექანიკოსი' : 'მომხმარებელი'}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2">
            <Link 
              to="/" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Home className="h-5 w-5" />
              <span>მთავარი</span>
            </Link>
            
            <Link 
              to="/services" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Wrench className="h-5 w-5" />
              <span>სერვისები</span>
            </Link>
            
            <Link 
              to="/chat" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span>ჩატი</span>
            </Link>
            
            <Link 
              to="/about" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Info className="h-5 w-5" />
              <span>ჩვენ შესახებ</span>
            </Link>
            
            <Link 
              to="/contact" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Phone className="h-5 w-5" />
              <span>კონტაქტი</span>
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="pt-4 border-t">
            {user ? (
              <div className="space-y-2">
                <Link 
                  to="/dashboard" 
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span>პროფილი</span>
                </Link>
                
                {user.role === 'mechanic' && (
                  <Link 
                    to="/add-service" 
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span>სერვისის დამატება</span>
                  </Link>
                )}
                
                <Link 
                  to="/dashboard/settings" 
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Settings className="h-5 w-5" />
                  <span>პარამეტრები</span>
                </Link>
                
                <button 
                  onClick={() => signOut()}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors w-full text-left text-destructive"
                >
                  <LogOut className="h-5 w-5" />
                  <span>გამოსვლა</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link to="/login" className="block">
                  <Button variant="outline" className="w-full">
                    შესვლა
                  </Button>
                </Link>
                <Link to="/register" className="block">
                  <Button className="w-full">
                    რეგისტრაცია
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
