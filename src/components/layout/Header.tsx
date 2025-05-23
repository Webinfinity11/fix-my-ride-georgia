
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu, X, User, Search, Wrench, ChevronDown } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on the homepage
  const isHomePage = location.pathname === '/';
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header 
      className={cn(
        "sticky top-0 w-full z-40 transition-all duration-300",
        isScrolled 
          ? "bg-white/95 backdrop-blur-md shadow-sm" 
          : isHomePage 
            ? "bg-transparent" 
            : "bg-white"
      )}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <div className="bg-primary/10 p-2 rounded-lg mr-2 group-hover:bg-primary/20 transition-colors">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark">
              ავტოხელოსანი
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/search">
                  <NavigationMenuLink 
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
                      "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                      location.pathname === "/search" ? "bg-accent/50 text-accent-foreground" : "text-foreground/80"
                    )}
                  >
                    <Search className="mr-1 h-4 w-4" />
                    ხელოსნების ძიება
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={
                    location.pathname === "/services" ? "bg-accent/50 text-accent-foreground" : "text-foreground/80"
                  }
                >
                  სერვისები
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {[
                      { name: "ძრავი", icon: "wrench", id: 1 },
                      { name: "ტრანსმისია", icon: "cog", id: 2 },
                      { name: "საჭე და საკიდარი", icon: "air-vent", id: 3 },
                      { name: "სამუხრუჭე სისტემა", icon: "gauge", id: 4 }
                    ].map((category) => (
                      <li key={category.id}>
                        <Link
                          to={`/search?category=${category.id}`}
                          className="flex select-none items-center rounded-md p-3 hover:bg-accent hover:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">{category.name}</div>
                        </Link>
                      </li>
                    ))}
                    <li className="md:col-span-2">
                      <Link
                        to="/services"
                        className="flex w-full select-none items-center justify-center rounded-md bg-accent p-3 text-center text-sm hover:bg-accent/80"
                      >
                        ყველა სერვისი
                      </Link>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link to="/about">
                  <NavigationMenuLink 
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
                      "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                      location.pathname === "/about" ? "bg-accent/50 text-accent-foreground" : "text-foreground/80"
                    )}
                  >
                    ჩვენს შესახებ
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link to="/contact">
                  <NavigationMenuLink 
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
                      "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                      location.pathname === "/contact" ? "bg-accent/50 text-accent-foreground" : "text-foreground/80"
                    )}
                  >
                    კონტაქტი
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          
          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard/profile">
                  <Button variant="outline" className="flex items-center gap-2 border-2">
                    <User size={18} />
                    პროფილი
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="text-foreground/80 hover:text-primary hover:bg-primary/10"
                >
                  გასვლა
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-white">
                    შესვლა
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-secondary hover:bg-secondary/90 shadow-sm">
                    რეგისტრაცია
                  </Button>
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-foreground/80 hover:text-primary p-2 rounded-md hover:bg-primary/5 transition-colors"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t animate-fade-in">
            <nav className="flex flex-col space-y-4 mb-6">
              <Link 
                to="/search" 
                className="text-foreground/80 hover:text-primary transition-colors flex items-center px-2 py-2 rounded-md hover:bg-primary/5"
                onClick={() => setIsMenuOpen(false)}
              >
                <Search className="h-4 w-4 mr-2" />
                ხელოსნების ძიება
              </Link>
              <Link 
                to="/services" 
                className="text-foreground/80 hover:text-primary transition-colors flex items-center px-2 py-2 rounded-md hover:bg-primary/5"
                onClick={() => setIsMenuOpen(false)}
              >
                <Wrench className="h-4 w-4 mr-2" />
                სერვისები
              </Link>
              <Link 
                to="/about" 
                className="text-foreground/80 hover:text-primary transition-colors px-2 py-2 rounded-md hover:bg-primary/5"
                onClick={() => setIsMenuOpen(false)}
              >
                ჩვენს შესახებ
              </Link>
              <Link 
                to="/contact" 
                className="text-foreground/80 hover:text-primary transition-colors px-2 py-2 rounded-md hover:bg-primary/5"
                onClick={() => setIsMenuOpen(false)}
              >
                კონტაქტი
              </Link>
            </nav>
            <div className="flex flex-col space-y-3 mb-2">
              {user ? (
                <>
                  <Link to="/dashboard/profile" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-2">
                      <User size={18} />
                      პროფილი
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-foreground/80 hover:text-primary"
                  >
                    გასვლა
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white">
                      შესვლა
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-secondary hover:bg-secondary-light">
                      რეგისტრაცია
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
