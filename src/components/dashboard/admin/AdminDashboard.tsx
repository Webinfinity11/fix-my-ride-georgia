
import AdminStats from "./AdminStats";
import ServiceManagement from "./ServiceManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Settings, Users, MessageSquare } from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ადმინისტრაციის პანელი</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            მიმოხილვა
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            სერვისის დეტალები
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            მომხმარებლები
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            შეტყობინებები
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

        <TabsContent value="services">
          <ServiceManagement />
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

        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>შეტყობინებების მართვა</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                შეტყობინებების მართვის ფუნქციონალი მალე დაემატება...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
