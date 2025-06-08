
import AdminStats from "./AdminStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ადმინისტრაციის პანელი</h1>
      </div>

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
    </div>
  );
};

export default AdminDashboard;
