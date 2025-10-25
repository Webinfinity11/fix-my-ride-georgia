
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Wrench, ArrowRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-primary-dark to-primary text-white">
      <div className="container mx-auto px-4">
        {/* Newsletter Section (can be enabled if needed) */}
        {/* <div className="py-10 border-b border-white/20">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">გამოიწერეთ ჩვენი სიახლეები</h3>
              <p className="text-blue-100">მიიღეთ სპეციალური შეთავაზებები და სიახლეები</p>
            </div>
            <div className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder="თქვენი ელ.ფოსტა"
                className="px-4 py-3 rounded-l-lg w-full md:w-64 outline-none text-gray-800"
              />
              <Button className="rounded-l-none bg-secondary hover:bg-secondary-light">
                გამოწერა <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div> */}
        
        {/* Main Footer */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-10">
            {/* Logo and Description */}
            <div className="col-span-1 md:col-span-1 lg:col-span-1">
              <Link to="/" className="flex items-center mb-6">
                <div className="bg-white/10 p-2 rounded-lg mr-2">
                  <Wrench className="h-6 w-6 text-secondary" />
                </div>
                <span className="text-xl font-bold">FixUp</span>
              </Link>
              <p className="text-blue-100 mb-6 leading-relaxed">
                პლატფორმა, რომელიც აკავშირებს ავტომობილის ხელოსნებს და მომხმარებლებს. 
                იპოვეთ საუკეთესო ხელოსანი თქვენი ავტომობილისთვის.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors" aria-label="Facebook-ის გვერდი">
                  <Facebook size={20} />
                </a>
                <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors" aria-label="Instagram-ის გვერდი">
                  <Instagram size={20} />
                </a>
                <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors" aria-label="Twitter-ის გვერდი">
                  <Twitter size={20} />
                </a>
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="col-span-1">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <span className="w-6 h-1 bg-secondary inline-block mr-2"></span>
                სწრაფი ბმულები
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/mechanic" className="text-blue-100 hover:text-secondary transition-colors flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    ხელოსნების ძიება
                  </Link>
                </li>
                <li>
                  <Link to="/services" className="text-blue-100 hover:text-secondary transition-colors flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    სერვისები
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-blue-100 hover:text-secondary transition-colors flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    ჩვენს შესახებ
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-blue-100 hover:text-secondary transition-colors flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    კონტაქტი
                  </Link>
                </li>
                <li>
                  <Link to="/sitemap" className="text-blue-100 hover:text-secondary transition-colors flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    საიტის რუკა
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-blue-100 hover:text-secondary transition-colors flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    ხშირად დასმული კითხვები
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* User Links */}
            <div className="col-span-1">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <span className="w-6 h-1 bg-secondary inline-block mr-2"></span>
                მომხმარებლები
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/register?type=mechanic" className="text-blue-100 hover:text-secondary transition-colors flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    ხელოსნის რეგისტრაცია
                  </Link>
                </li>
                <li>
                  <Link to="/register?type=customer" className="text-blue-100 hover:text-secondary transition-colors flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    მომხმარებლის რეგისტრაცია
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-blue-100 hover:text-secondary transition-colors flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    შესვლა
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="text-blue-100 hover:text-secondary transition-colors flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    პირადი კაბინეტი
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Contact Info */}
            <div className="col-span-1">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <span className="w-6 h-1 bg-secondary inline-block mr-2"></span>
                კონტაქტი
              </h3>
              <ul className="space-y-5">
                <li className="flex items-start">
                  <div className="bg-white/10 p-2 rounded-lg mr-3 mt-1">
                    <MapPin className="h-5 w-5 text-secondary shrink-0" />
                  </div>
                  <span className="text-blue-100">თბილისი, საქართველო</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-white/10 p-2 rounded-lg mr-3">
                    <Phone className="h-5 w-5 text-secondary shrink-0" />
                  </div>
                  <span className="text-blue-100">+995 574 04 79 94</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-white/10 p-2 rounded-lg mr-3">
                    <Mail className="h-5 w-5 text-secondary shrink-0" />
                  </div>
                  <span className="text-blue-100">info@fixup.ge</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/20 pt-8 pb-10 text-center text-blue-200">
          <p className="flex items-center justify-center gap-1 text-sm">
            &copy; {new Date().getFullYear()} FixUp. შექმნილია 
            <Heart className="h-4 w-4 text-secondary mx-1" fill="currentColor" /> 
            -ით. ყველა უფლება დაცულია.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
