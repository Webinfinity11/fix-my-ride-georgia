
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Wrench } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-1 lg:col-span-1">
            <Link to="/" className="flex items-center mb-4">
              <Wrench className="h-6 w-6 text-secondary mr-2" />
              <span className="text-xl font-bold">ავტოხელოსანი</span>
            </Link>
            <p className="text-gray-300 mb-4">
              პლატფორმა, რომელიც აკავშირებს ავტომობილის ხელოსნებს და მომხმარებლებს. 
              იპოვეთ საუკეთესო ხელოსანი თქვენი ავტომობილისთვის.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-secondary transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-secondary transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-secondary transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">სწრაფი ბმულები</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/search" className="text-gray-300 hover:text-secondary transition-colors">
                  ხელოსნების ძიება
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-300 hover:text-secondary transition-colors">
                  სერვისები
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-secondary transition-colors">
                  ჩვენს შესახებ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-secondary transition-colors">
                  კონტაქტი
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-300 hover:text-secondary transition-colors">
                  ხშირად დასმული კითხვები
                </Link>
              </li>
            </ul>
          </div>
          
          {/* User Links */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">მომხმარებლები</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/register?type=mechanic" className="text-gray-300 hover:text-secondary transition-colors">
                  ხელოსნის რეგისტრაცია
                </Link>
              </li>
              <li>
                <Link to="/register?type=customer" className="text-gray-300 hover:text-secondary transition-colors">
                  მომხმარებლის რეგისტრაცია
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-300 hover:text-secondary transition-colors">
                  შესვლა
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-300 hover:text-secondary transition-colors">
                  პირადი კაბინეტი
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">კონტაქტი</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-secondary shrink-0 mr-2 mt-0.5" />
                <span className="text-gray-300">თბილისი, საქართველო</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-secondary shrink-0 mr-2" />
                <span className="text-gray-300">+995 555 12 34 56</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-secondary shrink-0 mr-2" />
                <span className="text-gray-300">info@avtokhelosani.ge</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-10 pt-6 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} ავტოხელოსანი. ყველა უფლება დაცულია.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
