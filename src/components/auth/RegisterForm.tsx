import { PasswordInput } from "@/components/ui/password-input";

import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, Wrench } from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';

const RegisterForm = () => {
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') || 'mechanic'; // Default to mechanic
  const [formType, setFormType] = useState<UserRole>(
    defaultType === 'customer' ? 'customer' : 'mechanic'
  );

  const { signUp, loading } = useAuth();
  const navigate = useNavigate();

  // Basic form state
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log('🚀 Starting registration process for:', formType);

      // Register the user
      const { data, error } = await signUp(
        formData.email,
        formData.password,
        {
          phone: formData.phone,
          role: formType
        }
      );

      if (error) {
        console.error('❌ Registration error:', error);
        toast.error(`რეგისტრაცია ვერ მოხერხდა: ${error.message}`);
        return;
      }

      console.log('✅ User registration successful:', data?.user?.id);

      // Show success message
      toast.success(`${formType === 'mechanic' ? 'ხელოსანი' : 'მომხმარებელი'} წარმატებით დარეგისტრირდა!`);

      // Redirect based on user type - user should stay logged in
      if (formType === 'mechanic') {
        console.log('🔄 Redirecting mechanic to dashboard services page');
        navigate('/dashboard/services');
      } else {
        console.log('🔄 Redirecting customer to home page');
        navigate('/');
      }

    } catch (error: any) {
      console.error('❌ Unexpected registration error:', error);
      toast.error(`რეგისტრაცია ვერ მოხერხდა: ${error.message}`);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-auto border border-primary/10">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">რეგისტრაცია</h2>
        <p className="text-muted-foreground mt-2">შექმენით ახალი ანგარიში</p>
      </div>

      <Tabs defaultValue={formType} onValueChange={(v) => setFormType(v as UserRole)} className="mb-6">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="mechanic" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Wrench size={16} /> ხელოსანი
          </TabsTrigger>
          <TabsTrigger value="customer" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <User size={16} /> მომხმარებელი
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">ელ-ფოსტა</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="email@example.com"
              required
              value={formData.email}
              onChange={handleChange}
              className="border-primary/20 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">ტელეფონის ნომერი</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="555 12 34 56"
              required
              value={formData.phone}
              onChange={handleChange}
              className="border-primary/20 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">პაროლი</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="მინიმუმ 8 სიმბოლო"
              required
              value={formData.password}
              onChange={handleChange}
              className="border-primary/20 focus-visible:ring-primary"
            />
          </div>


        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary-light"
          disabled={loading}
        >
          {loading ? 'მიმდინარეობს...' : 'რეგისტრაცია'}
        </Button>

        <div className="text-center mt-4">
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
