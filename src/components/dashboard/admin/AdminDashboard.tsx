import AdminStats from "./AdminStats";
import ChatDashboard from "./chat/ChatDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, MessageCircle, Activity, Shield, Users } from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          ადმინისტრაციის პანელი
        </h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            მიმოხილვა
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            ჩატები
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            მომხმარებლები
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            სისტემა
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AdminStats />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ბოლო აქტივობა</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  ბოლო აქტივობების სია მალე დაემატება...
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>სისტემის მდგომარეობა</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">სისტემა მუშაობს სტაბილურად</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <ChatDashboard />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>მომხმარებლების მართვა</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                მომხმარებლების მართვის ფუნქციონალი მალე დაემატება...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>სისტემის კონფიგურაცია</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                სისტემის პარამეტრების მართვა მალე დაემატება...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
