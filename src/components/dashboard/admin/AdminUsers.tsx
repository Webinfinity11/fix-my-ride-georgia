
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, UserCheck, UserX } from "lucide-react";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'customer' | 'mechanic' | 'admin';
  is_verified: boolean;
  created_at: string;
  city?: string;
}

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as User[];
    },
  });

  const toggleVerificationMutation = useMutation({
    mutationFn: async ({ userId, verified }: { userId: string; verified: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: verified })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('მომხმარებლის სტატუსი წარმატებით განახლდა');
    },
    onError: () => {
      toast.error('შეცდომა მომხმარებლის სტატუსის განახლებისას');
    },
  });

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'mechanic':
        return 'bg-blue-100 text-blue-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'ადმინი';
      case 'mechanic':
        return 'მექანიკოსი';
      case 'customer':
        return 'მომხმარებელი';
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">მომხმარებლების მართვა</h1>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">მომხმარებლების მართვა</h1>

      <Card>
        <CardHeader>
          <CardTitle>ფილტრები</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ძებნა სახელით, გვარით ან ელ.ფოსტით..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="როლის არჩევა" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ყველა როლი</SelectItem>
                <SelectItem value="customer">მომხმარებელი</SelectItem>
                <SelectItem value="mechanic">მექანიკოსი</SelectItem>
                <SelectItem value="admin">ადმინი</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>მომხმარებლები ({filteredUsers?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers?.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-medium">
                      {user.first_name} {user.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.city && (
                      <p className="text-xs text-muted-foreground">{user.city}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    {user.is_verified ? (
                      <Badge className="bg-green-100 text-green-800">
                        ვერიფიცირებული
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        არავერიფიცირებული
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={user.is_verified ? "outline" : "default"}
                    onClick={() => 
                      toggleVerificationMutation.mutate({
                        userId: user.id,
                        verified: !user.is_verified
                      })
                    }
                    disabled={toggleVerificationMutation.isPending}
                  >
                    {user.is_verified ? (
                      <>
                        <UserX className="h-4 w-4 mr-1" />
                        ვერიფიკაციის გაუქმება
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-1" />
                        ვერიფიკაცია
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredUsers?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                მომხმარებლები ვერ მოიძებნა
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
