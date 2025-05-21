
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu, X, User, Search, Wrench } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Wrench className="h-6 w-6 text-secondary mr-2" />
            <span className="text-xl font-bold text-primary">ავტოხელოსანი</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/search" className="text-gray-600 hover:text-primary transition-colors">
              ხელოსნების ძიება
            </Link>
            <Link to="/services" className="text-gray-600 hover:text-primary transition-colors">
              სერვისები
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-primary transition-colors">
              ჩვენს შესახებ
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-primary transition-colors">
              კონტაქტი
            </Link>
          </nav>
          
          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                შესვლა
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-secondary hover:bg-secondary-light">
                რეგისტრაცია
              </Button>
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-500 hover:text-primary"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t">
            <nav className="flex flex-col space-y-4 mb-4">
              <Link 
                to="/search" 
                className="text-gray-600 hover:text-primary transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                ხელოსნების ძიება
              </Link>
              <Link 
                to="/services" 
                className="text-gray-600 hover:text-primary transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                სერვისები
              </Link>
              <Link 
                to="/about" 
                className="text-gray-600 hover:text-primary transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                ჩვენს შესახებ
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-600 hover:text-primary transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                კონტაქტი
              </Link>
            </nav>
            <div className="flex flex-col space-y-3">
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
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
