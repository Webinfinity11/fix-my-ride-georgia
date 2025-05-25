
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
import { LogOut, User, Settings, Plus, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("წარმატებით გამოხვედით სისტემიდან");
      navigate("/login");
    } catch (error) {
      toast.error("გასვლისას შეცდომა დაფიქსირდა");
    }
  };

  return (
    <header className="bg-white border-b h-16 md:h-20 flex items-center">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-primary">
          AutoHub
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-gray-700 hover:text-primary transition-colors">
            მთავარი
          </Link>
          <Link to="/services-detail" className="text-gray-700 hover:text-primary transition-colors">
            სერვისები
          </Link>
          <Link to="/about" className="text-gray-700 hover:text-primary transition-colors">
            ჩვენ შესახებ
          </Link>
          <Link to="/contact" className="text-gray-700 hover:text-primary transition-colors">
            კონტაქტი
          </Link>
          <Link to="/chat" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors">
            <MessageCircle className="h-4 w-4" />
            <span>ჩატი</span>
          </Link>
        </nav>

        {/* Auth Buttons */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                <User className="mr-2 h-4 w-4" />
                <span>პროფილი</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/add-service")}>
                <Plus className="mr-2 h-4 w-4" />
                <span>სერვისის დამატება</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>პარამეტრები</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>გამოსვლა</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login">
              <Button variant="outline">შესვლა</Button>
            </Link>
            <Link to="/register">
              <Button>რეგისტრაცია</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export { Header };
export default Header;
