import { BarChart3 } from "lucide-react";
import AdminStats from './AdminStats';
import ServicePhoneViewsStats from './ServicePhoneViewsStats';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          მიმოხილვა
        </h1>
      </div>

      <AdminStats />
      <ServicePhoneViewsStats />
    </div>
  );
};

export default AdminDashboard;

