
import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, Wrench } from "lucide-react";

const RegisterForm = () => {
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') || 'customer';
  const [formType, setFormType] = useState<'customer' | 'mechanic'>(
    defaultType === 'mechanic' ? 'mechanic' : 'customer'
  );
  
  const [loading, setLoading] = useState(false);
  
  // Basic form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: '',
    district: '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("პაროლები არ ემთხვევა!");
      setLoading(false);
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      // Just for demonstration - would be actual API call in real app
      toast.success(`${formType === 'mechanic' ? 'ხელოსანი' : 'მომხმარებელი'} წარმატებით დარეგისტრირდა!`);
      setLoading(false);
    }, 1500);
  };
  
  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">რეგისტრაცია</h2>
        <p className="text-muted-foreground mt-2">შექმენით ახალი ანგარიში</p>
      </div>
      
      <Tabs defaultValue={formType} onValueChange={(v) => setFormType(v as 'customer' | 'mechanic')} className="mb-6">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="customer" className="flex items-center gap-2">
            <User size={16} /> მომხმარებელი
          </TabsTrigger>
          <TabsTrigger value="mechanic" className="flex items-center gap-2">
            <Wrench size={16} /> ხელოსანი
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">სახელი</Label>
            <Input 
              id="firstName" 
              name="firstName" 
              placeholder="შეიყვანეთ სახელი" 
              required
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">გვარი</Label>
            <Input 
              id="lastName" 
              name="lastName" 
              placeholder="შეიყვანეთ გვარი" 
              required
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <Label htmlFor="email">ელ-ფოსტა</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="email@example.com" 
            required
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2 mb-4">
          <Label htmlFor="phone">ტელეფონის ნომერი</Label>
          <Input 
            id="phone" 
            name="phone" 
            placeholder="555 12 34 56" 
            required
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="city">ქალაქი</Label>
            <Input 
              id="city" 
              name="city" 
              placeholder="ქალაქი" 
              required
              value={formData.city}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">უბანი</Label>
            <Input 
              id="district" 
              name="district" 
              placeholder="უბანი" 
              required
              value={formData.district}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <Label htmlFor="password">პაროლი</Label>
          <Input 
            id="password" 
            name="password" 
            type="password" 
            placeholder="მინიმუმ 8 სიმბოლო" 
            required
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2 mb-6">
          <Label htmlFor="confirmPassword">გაიმეორეთ პაროლი</Label>
          <Input 
            id="confirmPassword" 
            name="confirmPassword" 
            type="password" 
            placeholder="გაიმეორეთ პაროლი" 
            required
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>
        
        {formType === 'mechanic' && (
          <div className="p-4 bg-blue-50 rounded mb-6">
            <p className="text-sm text-blue-700">
              ხელოსნების რეგისტრაციის დასრულების შემდეგ, თქვენ შეძლებთ დაამატოთ 
              თქვენი სერვისები, სამუშაო გრაფიკი და სერტიფიკატები პირად კაბინეტში.
            </p>
          </div>
        )}
        
        <Button type="submit" className="w-full bg-primary hover:bg-primary-light" disabled={loading}>
          {loading ? 'მიმდინარეობს...' : 'რეგისტრაცია'}
        </Button>
        
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            უკვე გაქვთ ანგარიში?{' '}
            <Link to="/login" className="text-primary hover:text-primary-light font-semibold">
              შესვლა
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
