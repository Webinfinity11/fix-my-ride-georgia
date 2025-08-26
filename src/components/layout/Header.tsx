import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, Plus, MessageCircle, Map } from "lucide-react";
import { toast } from "sonner";
import { MobileMenu } from "./MobileMenu";

// Facebook Pixel tracking function
declare global {
  interface Window {
    fbq?: (action: string, event: string, params?: any) => void;
  }
}

const trackPixelEvent = (event: string, params?: any) => {
  if (window.fbq) {
    window.fbq('track', event, params);
  }
};

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Track logout event
      trackPixelEvent('CompleteRegistration', {
        content_name: 'User Logout',
        status: 'success'
      });
      toast.success("წარმატებით გამოხვედით სისტემიდან");
      navigate("/login");
    } catch (error) {
      toast.error("გასვლისას შეცდომა დაფიქსირდა");
    }
  };

  const handleNavigateToServices = () => {
    trackPixelEvent('ViewContent', {
      content_type: 'services_page',
      content_name: 'Services Page View'
    });
  };

  const handleNavigateToAddService = () => {
    trackPixelEvent('InitiateCheckout', {
      content_type: 'service_creation',
      content_name: 'Add Service Started'
    });
    navigate("/add-service");
  };

  const handleNavigateToProfile = () => {
    trackPixelEvent('ViewContent', {
      content_type: 'profile_page',
      content_name: 'Profile Page View'
    });
    navigate("/dashboard");
  };

  const handleNavigateToChat = () => {
    trackPixelEvent('Contact', {
      content_name: 'Chat Opened'
    });
  };

  const handleNavigateToMap = () => {
    trackPixelEvent('Search', {
      search_string: 'mechanic_map',
      content_type: 'map_view'
    });
  };

  const handleLoginClick = () => {
    trackPixelEvent('Lead', {
      content_name: 'Login Button Clicked'
    });
  };

  const handleRegisterClick = () => {
    trackPixelEvent('Lead', {
      content_name: 'Register Button Clicked'
    });
  };

  return (
    <header className="bg-white border-b h-16 md:h-20 flex items-center sticky top-0 z-50">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Mobile Menu & Logo */}
        <div className="flex items-center gap-3">
          <MobileMenu />
          <Link to="/" className="text-xl md:text-2xl font-bold text-primary">
            FixUp
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-gray-700 hover:text-primary transition-colors font-medium">
            მთავარი
          </Link>
          <Link 
            to="/services" 
            onClick={handleNavigateToServices}
            className="text-gray-700 hover:text-primary transition-colors font-medium"
          >
            სერვისები
          </Link>
          <Link to="/about" className="text-gray-700 hover:text-primary transition-colors font-medium">
            ჩვენ შესახებ
          </Link>
          <Link to="/contact" className="text-gray-700 hover:text-primary transition-colors font-medium">
            კონტაქტი
          </Link>
          <Link 
            to="/map" 
            onClick={handleNavigateToMap}
            className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors font-medium"
          >
            <Map className="h-4 w-4" />
            <span>რუკა</span>
          </Link>
          <Link 
            to="/chat" 
            onClick={handleNavigateToChat}
            className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors font-medium"
          >
            <MessageCircle className="h-4 w-4" />
            <span>ჩატი</span>
          </Link>
        </nav>

        {/* Auth Section */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 p-0 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleNavigateToProfile}>
                <User className="mr-2 h-4 w-4" />
                <span>პროფილი</span>
              </DropdownMenuItem>
              {user.role === 'mechanic' && (
                <DropdownMenuItem onClick={handleNavigateToAddService}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>სერვისის დამატება</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>პარამეტრები</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>გამოსვლა</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login" onClick={handleLoginClick}>
              <Button variant="outline" size="sm">შესვლა</Button>
            </Link>
            <Link to="/register" onClick={handleRegisterClick}>
              <Button size="sm">რეგისტრაცია</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export { Header };
export default Header;