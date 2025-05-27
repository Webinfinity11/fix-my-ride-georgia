
import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import CustomerDashboard from "@/components/dashboard/customer/CustomerDashboard";
import MechanicDashboard from "@/components/dashboard/mechanic/MechanicDashboard";
import CustomerProfile from "@/components/dashboard/customer/CustomerProfile";
import MechanicProfile from "@/components/dashboard/mechanic/MechanicProfile";
import CustomerCars from "@/components/dashboard/customer/CustomerCars";
import MechanicServices from "@/components/dashboard/mechanic/MechanicServices";
import CustomerBookings from "@/components/dashboard/customer/CustomerBookings";
import MechanicBookings from "@/components/dashboard/mechanic/MechanicBookings";
import MechanicPortfolio from "@/components/dashboard/mechanic/MechanicPortfolio";
import { toast } from "sonner";

const Dashboard = () => {
  console.log("🏠 Dashboard component rendering");
  
  const { user, initialized, loading } = useAuth();
  const navigate = useNavigate();
  const [isDataLoading, setIsDataLoading] = useState(true);

  console.log("🏠 Dashboard auth state:", { 
    user: user ? { id: user.id, role: user.role } : null, 
    initialized, 
    loading 
  });

  useEffect(() => {
    console.log("🏠 Dashboard useEffect triggered", { initialized, loading, user: !!user });
    
    if (initialized && !loading) {
      if (!user) {
        console.log("🏠 No user found, redirecting to login");
        toast.error("სამართავ პანელზე წვდომისთვის გთხოვთ გაიაროთ ავტორიზაცია");
        navigate("/login");
      } else {
        console.log("🏠 User authenticated, stopping loading");
        setIsDataLoading(false);
      }
    }
  }, [user, initialized, loading, navigate]);

  // Show loading state while checking authentication
  if (loading || !initialized || isDataLoading) {
    console.log("🏠 Dashboard showing loading state");
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </main>
        <Footer />
      </div>
    );
  }

  // If user is not authenticated, we redirect in the useEffect
  if (!user) {
    console.log("🏠 No user, returning null");
    return null;
  }

  console.log("🏠 Dashboard rendering main content for user:", user.role);

  try {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex bg-muted py-8">
          <div className="container mx-auto px-4 flex flex-col md:flex-row gap-6">
            <DashboardSidebar />
            <div className="flex-grow bg-background rounded-lg shadow-sm p-6">
              <Routes>
                <Route
                  path="/"
                  element={
                    user.role === "mechanic" ? (
                      <MechanicDashboard />
                    ) : (
                      <CustomerDashboard />
                    )
                  }
                />
                <Route
                  path="/profile"
                  element={
                    user.role === "mechanic" ? (
                      <MechanicProfile />
                    ) : (
                      <CustomerProfile />
                    )
                  }
                />
                <Route
                  path="/cars"
                  element={
                    user.role === "customer" ? (
                      <CustomerCars />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                <Route
                  path="/services"
                  element={
                    user.role === "mechanic" ? (
                      <MechanicServices />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                <Route
                  path="/bookings"
                  element={
                    user.role === "mechanic" ? (
                      <MechanicBookings />
                    ) : (
                      <CustomerBookings />
                    )
                  }
                />
                <Route
                  path="/portfolio"
                  element={
                    user.role === "mechanic" ? (
                      <MechanicPortfolio />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  } catch (error) {
    console.error("🏠 Error rendering Dashboard:", error);
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">დაფიქსირდა შეცდომა</h1>
            <p className="text-gray-600">გთხოვთ განაახლოთ გვერდი</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
};

export default Dashboard;
