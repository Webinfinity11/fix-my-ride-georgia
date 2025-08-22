
import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Wrench, Facebook, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SEOHead from "@/components/seo/SEOHead";
import { generateSEOTitle, generateSEODescription, generateCanonicalURL } from "@/utils/seoUtils";

const Login = () => {
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.email || !form.password) {
      toast.error("შეავსეთ ყველა აუცილებელი ველი!");
      return;
    }
    
    const { error } = await signIn(form.email, form.password);
    
    if (error) {
      toast.error(`შესვლა ვერ მოხერხდა: ${error.message}`);
    } else {
      toast.success("წარმატებით შეხვედით სისტემაში!");
      navigate('/');
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={generateSEOTitle('login', {})}
        description={generateSEODescription('login', {})}
        keywords="შესვლა, ავტორიზაცია, ლოგინი, ავტოხელოსანი"
        canonical={generateCanonicalURL('login', {})}
        type="website"
      />
      <Header />
      
      <main className="flex-grow flex items-center justify-center bg-muted py-10">
        <div className="container mx-auto px-4">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-auto">
            <div className="flex justify-center mb-6">
              <div className="flex items-center">
                <Wrench className="h-8 w-8 text-secondary mr-2" />
                <span className="text-2xl font-bold text-primary">ავტოხელოსანი</span>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-6">სისტემაში შესვლა</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">ელ-ფოსტა</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="email@example.com" 
                    required
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">პაროლი</Label>
                    <Link to="/reset-password" className="text-sm text-primary hover:text-primary-light">
                      დაგავიწყდათ პაროლი?
                    </Link>
                  </div>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    placeholder="შეიყვანეთ პაროლი" 
                    required
                    value={form.password}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex items-center">
                  <input 
                    id="rememberMe" 
                    name="rememberMe" 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-light" 
                    checked={form.rememberMe}
                    onChange={handleChange}
                  />
                  <Label htmlFor="rememberMe" className="ml-2 text-sm cursor-pointer">
                    დამიმახსოვრე
                  </Label>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full mt-6 bg-primary hover:bg-primary-light" 
                disabled={loading}
              >
                {loading ? 'მიმდინარეობს...' : 'შესვლა'}
              </Button>
            </form>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-muted-foreground">ან</span>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full">
                  <Facebook size={16} className="mr-2" />
                  Facebook
                </Button>
                <Button variant="outline" className="w-full">
                  <Mail size={16} className="mr-2" />
                  Google
                </Button>
              </div>
            </div>
            
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">არ გაქვთ ანგარიში? </span>
              <Link to="/register" className="text-primary hover:text-primary-light font-semibold">
                რეგისტრაცია
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Login;
