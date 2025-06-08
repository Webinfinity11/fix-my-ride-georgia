
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'customer' | 'mechanic' | 'admin';
  phone?: string;
  city?: string;
  district?: string;
  is_verified: boolean;
}

interface UserEditDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  district: string;
}

const UserEditDialog = ({ user, open, onOpenChange }: UserEditDialogProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
  const [selectedRole, setSelectedRole] = useState<string>('customer');

  // Reset form when user changes or dialog opens
  useEffect(() => {
    if (user && open) {
      reset({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        district: user.district || '',
      });
      setSelectedRole(user.role);
    }
  }, [user, open, reset]);

  const updateUserMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!user?.id) throw new Error('User ID is required');
      
      console.log('Updating user with data:', formData, 'role:', selectedRole);
      
      // Use the new admin function
      const { error } = await supabase.rpc('admin_update_user_profile', {
        p_user_id: user.id,
        p_first_name: formData.first_name,
        p_last_name: formData.last_name,
        p_email: formData.email,
        p_phone: formData.phone || null,
        p_city: formData.city || null,
        p_district: formData.district || null,
        p_role: selectedRole as 'customer' | 'mechanic' | 'admin',
      });
      
      if (error) {
        console.error('Update error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('მომხმარებლის ინფორმაცია წარმატებით განახლდა');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('User update failed:', error);
      toast.error('შეცდომა მომხმარებლის ინფორმაციის განახლებისას: ' + error.message);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User ID is required');
      
      console.log('Deleting user:', user.id);
      
      // Use the new admin delete function
      const { error } = await supabase.rpc('admin_delete_user', {
        p_user_id: user.id
      });
      
      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('მომხმარებელი წარმატებით წაიშალა');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('User deletion failed:', error);
      toast.error('შეცდომა მომხმარებლის წაშლისას: ' + error.message);
    },
  });

  const onSubmit = (data: FormData) => {
    console.log('Form submitted with data:', data);
    updateUserMutation.mutate(data);
  };

  const handleDelete = () => {
    if (window.confirm(`დარწმუნებული ხართ, რომ გსურთ ${user?.first_name} ${user?.last_name}-ის წაშლა?`)) {
      deleteUserMutation.mutate();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
    setSelectedRole('customer');
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>მომხმარებლის რედაქტირება</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">სახელი</Label>
            <Input
              id="first_name"
              {...register("first_name", { required: "სახელი აუცილებელია" })}
            />
            {errors.first_name && (
              <p className="text-sm text-destructive">{errors.first_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">გვარი</Label>
            <Input
              id="last_name"
              {...register("last_name", { required: "გვარი აუცილებელია" })}
            />
            {errors.last_name && (
              <p className="text-sm text-destructive">{errors.last_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">ელ.ფოსტა</Label>
            <Input
              id="email"
              type="email"
              {...register("email", { 
                required: "ელ.ფოსტა აუცილებელია",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "არასწორი ელ.ფოსტის ფორმატი"
                }
              })}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">ტელეფონი</Label>
            <Input
              id="phone"
              {...register("phone")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">ქალაქი</Label>
            <Input
              id="city"
              {...register("city")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="district">უბანი</Label>
            <Input
              id="district"
              {...register("district")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">როლი</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">მომხმარებელი</SelectItem>
                <SelectItem value="mechanic">მექანიკოსი</SelectItem>
                <SelectItem value="admin">ადმინი</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={updateUserMutation.isPending || deleteUserMutation.isPending}
              >
                გაუქმება
              </Button>
              <Button
                type="submit"
                disabled={updateUserMutation.isPending || deleteUserMutation.isPending}
                className="flex-1"
              >
                {updateUserMutation.isPending ? 'შენახვა...' : 'შენახვა'}
              </Button>
            </div>
            
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={updateUserMutation.isPending || deleteUserMutation.isPending}
              className="w-full"
            >
              {deleteUserMutation.isPending ? 'წაშლა...' : 'წაშლა'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditDialog;
