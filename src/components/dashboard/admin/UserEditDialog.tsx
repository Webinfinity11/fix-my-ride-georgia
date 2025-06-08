
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

const UserEditDialog = ({ user, open, onOpenChange }: UserEditDialogProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, reset } = useForm<User>();
  const [selectedRole, setSelectedRole] = useState<string>('customer');

  // Reset form when user changes or dialog opens
  useEffect(() => {
    if (user && open) {
      setValue("first_name", user.first_name);
      setValue("last_name", user.last_name);
      setValue("email", user.email);
      setValue("phone", user.phone || '');
      setValue("city", user.city || '');
      setValue("district", user.district || '');
      setSelectedRole(user.role);
    }
  }, [user, open, setValue]);

  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const { error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('მომხმარებლის ინფორმაცია წარმატებით განახლდა');
      onOpenChange(false);
      reset();
    },
    onError: () => {
      toast.error('შეცდომა მომხმარებლის ინფორმაციის განახლებისას');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('მომხმარებელი წარმატებით წაიშალა');
      onOpenChange(false);
      reset();
    },
    onError: () => {
      toast.error('შეცდომა მომხმარებლის წაშლისას');
    },
  });

  const onSubmit = (data: User) => {
    updateUserMutation.mutate({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      city: data.city,
      district: data.district,
      role: selectedRole as 'customer' | 'mechanic' | 'admin',
    });
  };

  const handleDelete = () => {
    if (window.confirm(`დარწმუნებული ხართ, რომ გსურთ ${user?.first_name} ${user?.last_name}-ის წაშლა?`)) {
      deleteUserMutation.mutate();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
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
              {...register("first_name", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">გვარი</Label>
            <Input
              id="last_name"
              {...register("last_name", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">ელ.ფოსტა</Label>
            <Input
              id="email"
              type="email"
              {...register("email", { required: true })}
            />
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
              >
                გაუქმება
              </Button>
              <Button
                type="submit"
                disabled={updateUserMutation.isPending}
                className="flex-1"
              >
                შენახვა
              </Button>
            </div>
            
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteUserMutation.isPending}
              className="w-full"
            >
              წაშლა
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditDialog;
