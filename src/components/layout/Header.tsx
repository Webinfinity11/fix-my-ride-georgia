
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const navigationItems = [
    { name: "მთავარი", href: "/" },
    { name: "ყველა სერვისი", href: "/services-detail" },
    { name: "ხელოსნების ძიება", href: "/search" },
  ];

  return (
    <header className="bg-background sticky top-0 z-50 border-b">
      <div className="container py-4 px-4 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl">
          AutoHub
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {navigationItems.map((item) => (
            <Link key={item.name} to={item.href} className="hover:text-primary transition-colors">
              {item.name}
            </Link>
          ))}
        </nav>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://avatar.vercel.sh/${user?.email}.png`} alt={user?.email} />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem onClick={() => navigate("/dashboard")}>პროფილი</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>გამოსვლა</DropdownMenuItem>
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

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="sm">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:w-2/3 md:w-full">
            <SheetHeader className="text-left">
              <SheetTitle>მენიუ</SheetTitle>
              <SheetDescription>
                გთხოვთ, აირჩიოთ სასურველი ოპერაცია ქვემოთ
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              {navigationItems.map((item) => (
                <Link key={item.name} to={item.href} className="block py-2 hover:text-primary transition-colors">
                  {item.name}
                </Link>
              ))}
              {!user ? (
                <>
                  <Link to="/login">
                    <Button variant="outline">შესვლა</Button>
                  </Link>
                  <Link to="/register">
                    <Button>რეგისტრაცია</Button>
                  </Link>
                </>
              ) : (
                <Button onClick={handleLogout} variant="destructive">
                  გამოსვლა
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
