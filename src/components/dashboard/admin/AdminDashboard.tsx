
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { BarChart3, Shield, Users, Activity, Search, Bookmark, Fuel, Megaphone, Award, MessageSquare, Crown } from "lucide-react";
import SEOManagement from './SEOManagement';
import SitemapManagement from './SitemapManagement';
import { SavedServicesManagement } from './SavedServicesManagement';
import FuelImporterManagement from './FuelImporterManagement';
import { AdminFuelBrands } from './AdminFuelBrands';
import AdminStats from './AdminStats';
import ServicePhoneViewsStats from './ServicePhoneViewsStats';
import BannerManagement from './BannerManagement';
import { AdminCommunity } from './AdminCommunity';
import { AdminVIPManagement } from './AdminVIPManagement';

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
        <ScrollArea className="w-full">
          <TabsList className="inline-flex h-10 w-full md:grid md:grid-cols-10 md:max-w-6xl">
            <TabsTrigger value="overview" className="flex items-center gap-2 whitespace-nowrap">
              <Activity className="h-4 w-4" />
              მიმოხილვა
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 whitespace-nowrap">
              <Users className="h-4 w-4" />
              მომხმარებლები
            </TabsTrigger>
            <TabsTrigger value="vip" className="flex items-center gap-2 whitespace-nowrap">
              <Crown className="h-4 w-4" />
              VIP მართვა
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2 whitespace-nowrap">
              <MessageSquare className="h-4 w-4" />
              Community
            </TabsTrigger>
            <TabsTrigger value="fuel" className="flex items-center gap-2 whitespace-nowrap">
              <Fuel className="h-4 w-4" />
              საწვავი
            </TabsTrigger>
            <TabsTrigger value="brands" className="flex items-center gap-2 whitespace-nowrap">
              <Award className="h-4 w-4" />
              ბრენდები
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2 whitespace-nowrap">
              <Bookmark className="h-4 w-4" />
              შენახული
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2 whitespace-nowrap">
              <Shield className="h-4 w-4" />
              სისტემა
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2 whitespace-nowrap">
              <Search className="h-4 w-4" />
              SEO მართვა
            </TabsTrigger>
            <TabsTrigger value="banners" className="flex items-center gap-2 whitespace-nowrap">
              <Megaphone className="h-4 w-4" />
              რეკლამები
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

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
        
        <TabsContent value="vip" className="space-y-6">
          <AdminVIPManagement />
        </TabsContent>
        
        <TabsContent value="community" className="space-y-6">
          <AdminCommunity />
        </TabsContent>

        <TabsContent value="fuel" className="space-y-6">
          <FuelImporterManagement />
        </TabsContent>

        <TabsContent value="brands" className="space-y-6">
          <AdminFuelBrands />
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

        <TabsContent value="banners" className="space-y-6">
          <BannerManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;

