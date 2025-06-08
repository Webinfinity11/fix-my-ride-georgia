import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, UserCheck, UserX, Edit2, Wrench } from "lucide-react";
import UserEditDialog from "./UserEditDialog";
import UserServicesList from "./UserServicesList";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'customer' | 'mechanic' | 'admin';
  is_verified: boolean;
  created_at: string;
  city?: string;
  phone?: string;
}

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false);
  const [servicesUser, setServicesUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      console.log('Fetching users...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      console.log('Fetched users:', data);
      return data as User[];
    },
  });

  const toggleVerificationMutation = useMutation({
    mutationFn: async ({ userId, verified }: { userId: string; verified: boolean }) => {
      console.log('Toggling verification for user:', userId, 'to:', verified);
      
      // Use the new admin toggle verification function
      const { error } = await supabase.rpc('admin_toggle_verification', {
        p_user_id: userId,
        p_verified: verified
      });
      
      if (error) {
        console.error('Verification toggle error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('მომხმარებლის სტატუსი წარმატებით განახლდა');
    },
    onError: (error) => {
      console.error('Verification error:', error);
      toast.error('შეცდომა მომხმარებლის სტატუსის განახლებისას: ' + error.message);
    },
  });

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  const handleEditUser = (user: User) => {
    console.log('Opening edit dialog for user:', user);
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleViewServices = (user: User) => {
    console.log('Opening services dialog for user:', user);
    setServicesUser(user);
    setServicesDialogOpen(true);
  };

  const handleEditDialogClose = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      console.log('Closing edit dialog, clearing selected user');
      setSelectedUser(null);
    }
  };

  const handleServicesDialogClose = (open: boolean) => {
    setServicesDialogOpen(open);
    if (!open) {
      console.log('Closing services dialog, clearing services user');
      setServicesUser(null);
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
    <>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">მომხმარებლების მართვა</h1>

        <Card>
          <CardHeader>
            <CardTitle>ფილტრები</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
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
                <SelectTrigger className="w-full sm:w-48">
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
                <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium truncate">
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      {user.city && (
                        <p className="text-xs text-muted-foreground">{user.city}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
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
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">რედაქტირება</span>
                    </Button>
                    
                    {user.role === 'mechanic' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewServices(user)}
                      >
                        <Wrench className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">სერვისები</span>
                      </Button>
                    )}
                    
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
                          <span className="hidden sm:inline">გაუქმება</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">ვერიფიკაცია</span>
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

      <UserEditDialog
        user={selectedUser}
        open={editDialogOpen}
        onOpenChange={handleEditDialogClose}
      />

      {servicesUser && (
        <UserServicesList
          userId={servicesUser.id}
          userName={`${servicesUser.first_name} ${servicesUser.last_name}`}
          open={servicesDialogOpen}
          onOpenChange={handleServicesDialogClose}
        />
      )}
    </>
  );
};

export default AdminUsers;
