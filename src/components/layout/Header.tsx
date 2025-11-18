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
import { LogOut, User, Settings, Plus, Users, Map } from "lucide-react";
import { toast } from "sonner";
import { MobileMenu } from "./MobileMenu";

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
    <header className="bg-white border-b h-16 md:h-20 flex items-center sticky top-0 z-50">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Mobile Menu & Logo */}
        <div className="flex items-center gap-3">
          <MobileMenu />
          <Link to="/" className="flex items-center">
            <img
              src="/lovable-uploads/5f51074d-5448-460f-9f3b-565872e756f9.png"
              alt="FixUp Auto Service"
              width="164"
              height="80"
              fetchPriority="high"
              className="h-8 md:h-10 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-gray-700 hover:text-primary transition-colors font-medium">
            მთავარი
          </Link>
          <Link to="/services" className="text-gray-700 hover:text-primary transition-colors font-medium">
            სერვისები
          </Link>
          <Link
            to="/map"
            className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors font-medium"
          >
            <Map className="h-4 w-4" />
            <span>რუკა</span>
          </Link>
          <Link to="/laundries" className="text-gray-700 hover:text-primary transition-colors font-medium">
            სამრეცხაო
          </Link>
          <Link to="/vacancies" className="text-gray-700 hover:text-primary transition-colors font-medium">
            ვაკანსიები
          </Link>
          <Link to="/fuel-importers" className="text-gray-700 hover:text-primary transition-colors font-medium">
            საწვავის ფასები
          </Link>
          <Link
            to="/community"
            className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors font-medium"
          >
            <Users className="h-4 w-4" />
            <span>community</span>
          </Link>
          <Link to="/blog" className="text-gray-700 hover:text-primary transition-colors font-medium">
            ბლოგი
          </Link>
        </nav>

        {/* Auth Section */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 p-0 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.firstName?.charAt(0)}
                    {user.lastName?.charAt(0)}
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
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                <User className="mr-2 h-4 w-4" />
                <span>პროფილი</span>
              </DropdownMenuItem>
              {user.role === "mechanic" && (
                <DropdownMenuItem onClick={() => navigate("/add-service")}>
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
            <Link to="/login">
              <Button variant="outline" size="sm">
                შესვლა
              </Button>
            </Link>
            <Link to="/register">
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
