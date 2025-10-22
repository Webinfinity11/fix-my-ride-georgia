
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Shield, Users, Activity, Search, Bookmark, Fuel } from "lucide-react";
import SEOManagement from './SEOManagement';
import SitemapManagement from './SitemapManagement';
import { SavedServicesManagement } from './SavedServicesManagement';
import FuelImporterManagement from './FuelImporterManagement';
import AdminStats from './AdminStats';
import ServicePhoneViewsStats from './ServicePhoneViewsStats';

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
        <TabsList className="grid grid-cols-6 w-full max-w-5xl">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            მიმოხილვა
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            მომხმარებლები
          </TabsTrigger>
          <TabsTrigger value="fuel" className="flex items-center gap-2">
            <Fuel className="h-4 w-4" />
            საწვავი
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            შენახული
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            სისტემა
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            SEO მართვა
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AdminStats />
          <ServicePhoneViewsStats />
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

        <TabsContent value="fuel" className="space-y-6">
          <FuelImporterManagement />
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          <SavedServicesManagement />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <SitemapManagement />
          
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

        <TabsContent value="seo" className="space-y-6">
          <SEOManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;

