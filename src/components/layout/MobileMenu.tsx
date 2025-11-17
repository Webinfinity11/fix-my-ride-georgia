
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Menu, Home, Wrench, Info, Phone, Map, Droplet, Sparkles, Briefcase } from 'lucide-react';

export const MobileMenu = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="მენიუს გახსნა">
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
              to="/map" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Map className="h-5 w-5" />
              <span>რუკა</span>
            </Link>

            <Link
              to="/laundries"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Sparkles className="h-5 w-5" />
              <span>სამრეცხაო</span>
            </Link>

            <Link
              to="/vacancies"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Briefcase className="h-5 w-5" />
              <span>ვაკანსიები</span>
            </Link>

            <Link
              to="/fuel-importers"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Droplet className="h-5 w-5" />
              <span>საწვავი</span>
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
        </div>
      </SheetContent>
    </Sheet>
  );
};
