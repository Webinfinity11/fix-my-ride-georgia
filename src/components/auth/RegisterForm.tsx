
import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, Wrench, Upload, MapPin } from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';

const RegisterForm = () => {
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') || 'customer';
  const [formType, setFormType] = useState<UserRole>(
    defaultType === 'mechanic' ? 'mechanic' : 'customer'
  );
  
  const { signUp, loading } = useAuth();
  const navigate = useNavigate();
  
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
    street: '',
    building: '',
    apartment: '',
    avatar: null as File | null,
    isMobile: false,
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        avatar: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!formData.avatar) return null;
    
    setUploadingAvatar(true);
    try {
      const fileExt = formData.avatar.name.split('.').pop();
      const fileName = `${userId}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      // Check if avatars bucket exists, create if not
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find(bucket => bucket.name === 'avatars')) {
        await supabase.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: 5242880 // 5MB
        });
      }
      
      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, formData.avatar);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      toast.error(`ფოტოს ატვირთვა ვერ მოხერხდა: ${error.message}`);
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("პაროლები არ ემთხვევა!");
      return;
    }
    
    try {
      // Register the user
      const { data, error } = await signUp(
        formData.email,
        formData.password,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          city: formData.city,
          district: formData.district,
          street: formData.street,
          role: formType
        }
      );
      
      if (error) {
        toast.error(`რეგისტრაცია ვერ მოხერხდა: ${error.message}`);
        return;
      }
      
      // If user is created and we have an avatar, upload it
      if (data?.user && formData.avatar) {
        const avatarUrl = await uploadAvatar(data.user.id);
        
        if (avatarUrl) {
          // Update user profile with avatar URL
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: avatarUrl })
            .eq('id', data.user.id);
          
          if (updateError) {
            toast.error(`პროფილის განახლება ვერ მოხერხდა: ${updateError.message}`);
          }
        }
      }
      
      // If user is mechanic, create mechanic profile
      if (formType === 'mechanic' && data?.user) {
        const { error: mechanicError } = await supabase
          .from('mechanic_profiles')
          .insert({
            id: data.user.id,
            is_mobile: formData.isMobile
          });
        
        if (mechanicError) {
          toast.error(`ხელოსნის პროფილის შექმნა ვერ მოხერხდა: ${mechanicError.message}`);
        }
      }
      
      toast.success(`${formType === 'mechanic' ? 'ხელოსანი' : 'მომხმარებელი'} წარმატებით დარეგისტრირდა!`);
      navigate('/');
    } catch (error: any) {
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
          <TabsTrigger value="customer" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <User size={16} /> მომხმარებელი
          </TabsTrigger>
          <TabsTrigger value="mechanic" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Wrench size={16} /> ხელოსანი
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          <div className="text-center mb-4">
            <div 
              className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 overflow-hidden border-2 border-primary/20"
              style={{ backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              {!avatarPreview && <User size={36} className="text-muted-foreground" />}
            </div>
            <Label 
              htmlFor="avatar" 
              className="cursor-pointer inline-flex items-center gap-1 text-sm text-primary hover:text-primary-light"
            >
              <Upload size={14} className="inline" />
              {formType === 'mechanic' ? 'ფოტო (სასურველია)' : 'ატვირთეთ ფოტო'}
            </Label>
            <Input 
              id="avatar" 
              name="avatar" 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">სახელი</Label>
              <Input 
                id="firstName" 
                name="firstName" 
                placeholder="შეიყვანეთ სახელი" 
                required
                value={formData.firstName}
                onChange={handleChange}
                className="border-primary/20 focus-visible:ring-primary"
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
                className="border-primary/20 focus-visible:ring-primary"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">ელ-ფოსტა</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
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
              placeholder="555 12 34 56" 
              required
              value={formData.phone}
              onChange={handleChange}
              className="border-primary/20 focus-visible:ring-primary"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              <MapPin size={16} className="text-primary" />
              <Label>მისამართი</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm text-muted-foreground">ქალაქი</Label>
                <Input 
                  id="city" 
                  name="city" 
                  placeholder="ქალაქი" 
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="border-primary/20 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district" className="text-sm text-muted-foreground">უბანი</Label>
                <Input 
                  id="district" 
                  name="district" 
                  placeholder="უბანი" 
                  required
                  value={formData.district}
                  onChange={handleChange}
                  className="border-primary/20 focus-visible:ring-primary"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="street" className="text-sm text-muted-foreground">ქუჩა</Label>
              <Input 
                id="street" 
                name="street" 
                placeholder="ქუჩა" 
                value={formData.street}
                onChange={handleChange}
                className="border-primary/20 focus-visible:ring-primary"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building" className="text-sm text-muted-foreground">შენობა</Label>
                <Input 
                  id="building" 
                  name="building" 
                  placeholder="შენობა" 
                  value={formData.building}
                  onChange={handleChange}
                  className="border-primary/20 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apartment" className="text-sm text-muted-foreground">ბინა</Label>
                <Input 
                  id="apartment" 
                  name="apartment" 
                  placeholder="ბინა" 
                  value={formData.apartment}
                  onChange={handleChange}
                  className="border-primary/20 focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">პაროლი</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="მინიმუმ 8 სიმბოლო" 
              required
              value={formData.password}
              onChange={handleChange}
              className="border-primary/20 focus-visible:ring-primary"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">გაიმეორეთ პაროლი</Label>
            <Input 
              id="confirmPassword" 
              name="confirmPassword" 
              type="password" 
              placeholder="გაიმეორეთ პაროლი" 
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="border-primary/20 focus-visible:ring-primary"
            />
          </div>
          
          {formType === 'mechanic' && (
            <>
              <div className="flex items-center space-x-2 mt-4">
                <input
                  type="checkbox"
                  id="isMobile"
                  name="isMobile"
                  checked={formData.isMobile}
                  onChange={handleSwitchChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isMobile" className="cursor-pointer text-sm">
                  ვთავაზობ მომსახურებას მისამართზე მისვლით
                </Label>
              </div>
            
              <div className="p-4 bg-blue-50 rounded my-4">
                <p className="text-sm text-blue-700">
                  ხელოსნების რეგისტრაციის დასრულების შემდეგ, თქვენ შეძლებთ დაამატოთ 
                  თქვენი სერვისები, სამუშაო გრაფიკი და სერტიფიკატები პირად კაბინეტში.
                </p>
              </div>
            </>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary-light" 
          disabled={loading || uploadingAvatar}
        >
          {loading || uploadingAvatar ? 'მიმდინარეობს...' : 'რეგისტრაცია'}
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
