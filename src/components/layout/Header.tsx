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
import { LogOut, User, Settings, Plus, Map, Package, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useSavedServices } from "@/hooks/useSavedServices";
import TopRibbon from "@/components/layout/TopRibbon";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { count: savedCount } = useSavedServices();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("წარმატებით გამოხვედით სისტემიდან");
      navigate("/login");
    } catch (error) {
      toast.error("გასვლისას შეცდომა დაფიქსირდა");
    }
  };

  // Saved services (guest-friendly, localStorage).
  const savedLink = (visibility: string) => (
    <Link
      to="/saved"
      aria-label="შენახული სერვისები"
      className={`relative h-10 w-10 rounded-full place-items-center text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors ${visibility}`}
    >
      <Bookmark className="h-5 w-5" />
      {savedCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
          {savedCount}
        </span>
      )}
    </Link>
  );

  return (
    <>
    {/* Two tiers on every page: the utility ribbon scrolls away, the header stays. */}
    <TopRibbon />
    <header className="bg-white border-b h-16 md:h-20 flex items-center sticky top-0 z-50">
      <div className="relative max-w-[1280px] mx-auto w-full px-4 lg:px-8 flex items-center">
        {/* Left zone. On phones: saved list here, logo centred, "add" is in the ribbon. */}
        <div className="flex items-center gap-3 flex-1">
          <Link to="/" className="absolute inset-y-0 left-0 right-0 mx-auto flex w-fit items-center md:static md:mx-0">
            <img
              src="/assets/fixup-logo-6c6398d629fe8a15.webp"
              alt="FixUp Auto Service"
              width="163"
              height="80"
              {...({ fetchpriority: "auto" } as Record<string, string>)}
              className="h-12 md:h-10 w-auto object-contain"
            />
          </Link>
          {savedLink("grid md:hidden")}
        </div>

        {/* Center zone: navigation (Planflow layout — centered, rounded-hover) */}
        <nav className="hidden md:flex items-center gap-1 text-[13px] font-medium text-gray-700">
          <Link to="/services" className="h-9 px-3 rounded-lg hover:bg-muted transition-colors inline-flex items-center">
            სერვისები
          </Link>
          <Link to="/map" className="h-9 px-3 rounded-lg hover:bg-muted transition-colors inline-flex items-center gap-1.5">
            <Map className="h-4 w-4" />რუკა
          </Link>
          <Link to="/fuel-importers" className="h-9 px-3 rounded-lg hover:bg-muted transition-colors inline-flex items-center">
            საწვავის ფასები
          </Link>
          <Link to="/blog" className="h-9 px-3 rounded-lg hover:bg-muted transition-colors inline-flex items-center">
            ბლოგი
          </Link>
        </nav>

        {/* Right zone: actions */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {savedLink("hidden md:grid")}

          {/* Auth Section */}
          {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 p-0 rounded-full" aria-label="პროფილის მენიუ">
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
            <>
              {/* Phones: an icon, so that nothing runs under the centred logo */}
              <Link
                to="/login"
                aria-label="შესვლა"
                className="md:hidden h-10 w-10 rounded-full grid place-items-center bg-primary/10 text-primary"
              >
                <User className="h-5 w-5" />
              </Link>
              {/* Desktop authentication actions */}
              <div className="hidden md:flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/5">
                  <Link to="/login">შესვლა</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/register">რეგისტრაცია</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
    </>
  );
};

export { Header };
export default Header;
