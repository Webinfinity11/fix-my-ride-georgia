
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminStats from './AdminStats';
import AdminUsers from './AdminUsers';
import ServiceManagement from './ServiceManagement';
import ChatManagement from './ChatManagement';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            ავტორიზაცია საჭიროა
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            ადმინისტრაციის პანელის სანახავად გთხოვთ, გაიაროთ ავტორიზაცია.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">ადმინისტრაციის პანელი</h1>
      </div>
      
      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="stats">სტატისტიკა</TabsTrigger>
          <TabsTrigger value="users">მომხმარებლები</TabsTrigger>
          <TabsTrigger value="services">სერვისები</TabsTrigger>
          <TabsTrigger value="chats">ჩატები</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <AdminStats />
        </TabsContent>

        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>

        <TabsContent value="services">
          <ServiceManagement />
        </TabsContent>

        <TabsContent value="chats">
          <ChatManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
