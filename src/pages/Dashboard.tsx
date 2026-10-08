import { lazy, Suspense, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/layout/Layout";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Header } from "@/components/layout/Header";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import MechanicMobileHeader from "@/components/dashboard/mechanic/MechanicMobileHeader";
import { toast } from "sonner";

const CustomerDashboard = lazy(() => import("@/components/dashboard/customer/CustomerDashboard"));
const MechanicDashboard = lazy(() => import("@/components/dashboard/mechanic/MechanicDashboard"));
const AdminDashboard = lazy(() => import("@/components/dashboard/admin/AdminDashboard"));
const AdminAnalytics = lazy(() => import("@/components/dashboard/admin/AdminAnalytics"));
const CustomerProfile = lazy(() => import("@/components/dashboard/customer/CustomerProfile"));
const MechanicProfile = lazy(() => import("@/components/dashboard/mechanic/MechanicProfile"));
const CustomerCars = lazy(() => import("@/components/dashboard/customer/CustomerCars"));
const MechanicServices = lazy(() => import("@/components/dashboard/mechanic/MechanicServices"));
const MechanicVacancies = lazy(() => import("@/components/dashboard/mechanic/MechanicVacancies"));
const CustomerBookings = lazy(() => import("@/components/dashboard/customer/CustomerBookings"));
const MechanicBookings = lazy(() => import("@/components/dashboard/mechanic/MechanicBookings"));
const AdminUsers = lazy(() => import("@/components/dashboard/admin/AdminUsers"));
const ServiceManagement = lazy(() => import("@/components/dashboard/admin/ServiceManagement"));
const ChatManagement = lazy(() => import("@/components/dashboard/admin/ChatManagement"));
const LaundryManagement = lazy(() => import("@/components/dashboard/admin/LaundryManagement"));
const DriveManagement = lazy(() => import("@/components/dashboard/admin/DriveManagement").then(module => ({ default: module.DriveManagement })));
const BookingManagement = lazy(() => import("@/components/dashboard/admin/BookingManagement"));
const SavedServicesManagement = lazy(() => import("@/components/dashboard/admin/SavedServicesManagement"));
const AdminVIPManagement = lazy(() => import("@/components/dashboard/admin/AdminVIPManagement").then(module => ({ default: module.AdminVIPManagement })));
const AdminCommunity = lazy(() => import("@/components/dashboard/admin/AdminCommunity").then(module => ({ default: module.AdminCommunity })));
const FuelImporterManagement = lazy(() => import("@/components/dashboard/admin/FuelImporterManagement"));
const AdminFuelBrands = lazy(() => import("@/components/dashboard/admin/AdminFuelBrands").then(module => ({ default: module.AdminFuelBrands })));
const SEOManagement = lazy(() => import("@/components/dashboard/admin/SEOManagement"));
const BannerManagement = lazy(() => import("@/components/dashboard/admin/BannerManagement"));
const AdminLeads = lazy(() => import("@/components/dashboard/admin/AdminLeads"));
const AdminRequests = lazy(() => import("@/components/dashboard/admin/AdminRequests"));
const AdminPartsOrders = lazy(() => import("@/components/dashboard/admin/AdminPartsOrders").then(module => ({ default: module.AdminPartsOrders })));
const AdminEvacuatorRequests = lazy(() => import("@/components/dashboard/admin/AdminEvacuatorRequests").then(module => ({ default: module.AdminEvacuatorRequests })));
const BlogManagement = lazy(() => import("@/components/dashboard/admin/BlogManagement").then(module => ({ default: module.BlogManagement })));
const CustomerSavedServices = lazy(() => import("@/components/dashboard/customer/CustomerSavedServices").then(module => ({ default: module.CustomerSavedServices })));
const MechanicSavedServices = lazy(() => import("@/components/dashboard/mechanic/MechanicSavedServices").then(module => ({ default: module.MechanicSavedServices })));
const CustomerSavedPosts = lazy(() => import("@/components/dashboard/customer/CustomerSavedPosts").then(module => ({ default: module.CustomerSavedPosts })));

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
      <Layout>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  // If user is not authenticated, we redirect in the useEffect
  if (!user) {
    console.log("🏠 No user, returning null");
    return null;
  }

  console.log("🏠 Dashboard rendering main content for user:", user.role);

  const getDashboardComponent = () => {
    switch (user.role) {
      case "admin":
        return <AdminDashboard />;
      case "mechanic":
        return <MechanicDashboard />;
      default:
        return <CustomerDashboard />;
    }
  };

  const getProfileComponent = () => {
    switch (user.role) {
      case "mechanic":
        return <MechanicProfile />;
      default:
        return <CustomerProfile />;
    }
  };

  try {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Private area — never index */}
        <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
        {/* Desktop Header - only show on desktop */}
        <div className="hidden md:block">
          <Header />
        </div>

        {/* Mobile Header for Mechanic - only show on mobile */}
        {user.role === "mechanic" && <MechanicMobileHeader />}

        <main className="flex-grow flex bg-muted py-4 md:py-8 pb-[70px] md:pb-8">
          <div className="container mx-auto px-2 md:px-4 flex flex-col md:flex-row gap-3 md:gap-6">
            {/* Desktop Sidebar - only show on desktop */}
            <div className="hidden md:block">
              <DashboardSidebar />
            </div>
            
            {/* Mobile Sidebar - only show on mobile */}
            <div className="md:hidden mb-3">
              <DashboardSidebar />
            </div>
            
            <div className="flex-grow bg-background rounded-lg shadow-sm p-3 md:p-6 overflow-hidden">
              <Suspense fallback={
                <div role="status" className="flex min-h-48 items-center justify-center gap-3 text-muted-foreground">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
                  <span>განყოფილება იტვირთება...</span>
                </div>
              }>
              <Routes>
                <Route
                  path="/"
                  element={getDashboardComponent()}
                />
                <Route
                  path="/profile"
                  element={getProfileComponent()}
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
                  path="/vacancies"
                  element={
                    user.role === "mechanic" ? (
                      <MechanicVacancies />
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
                
                {/* Saved Services Routes */}
                <Route
                  path="/saved-services"
                  element={
                    user.role === "customer" ? (
                      <CustomerSavedServices />
                    ) : user.role === "mechanic" ? (
                      <MechanicSavedServices />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                
                {/* Saved Posts Route */}
                <Route
                  path="/saved-posts"
                  element={
                    user.role === "customer" || user.role === "mechanic" ? (
                      <CustomerSavedPosts />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                
                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    user.role === "admin" ? (
                      <AdminDashboard />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    user.role === "admin" ? (
                      <AdminAnalytics />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                <Route
                  path="/admin/service-details"
                  element={
                    user.role === "admin" ? (
                      <ServiceManagement />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                <Route
                  path="/admin/chat-management"
                  element={
                    user.role === "admin" ? (
                      <ChatManagement />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                <Route
                  path="/admin/laundries"
                  element={
                    user.role === "admin" ? (
                      <LaundryManagement />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                <Route
                  path="/admin/drives"
                  element={
                    user.role === "admin" ? (
                      <DriveManagement />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                <Route
                  path="/admin/booking-management"
                  element={
                    user.role === "admin" ? (
                      <BookingManagement />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                <Route
                  path="/admin/vip-management"
                  element={
                    user.role === "admin" ? (
                      <AdminVIPManagement />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                <Route
                  path="/admin/community"
                  element={
                    user.role === "admin" ? (
                      <AdminCommunity />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                <Route
                  path="/admin/fuel-importers"
                  element={
                    user.role === "admin" ? (
                      <FuelImporterManagement />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                <Route
                  path="/admin/fuel-brands"
                  element={
                    user.role === "admin" ? (
                      <AdminFuelBrands />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    user.role === "admin" ? (
                      <AdminUsers />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                <Route
                  path="/admin/saved-services"
                  element={
                    user.role === "admin" ? (
                      <SavedServicesManagement />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                <Route
                  path="/admin/seo"
                  element={
                    user.role === "admin" ? (
                      <SEOManagement />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                <Route
                  path="/admin/banners"
                  element={
                    user.role === "admin" ? (
                      <BannerManagement />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                  <Route
                    path="/admin/leads"
                    element={
                      user.role === "admin" ? (
                        <AdminLeads />
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/admin/requests"
                    element={
                      user.role === "admin" ? (
                        <AdminRequests />
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/admin/parts-orders"
                    element={
                      user.role === "admin" ? (
                        <AdminPartsOrders />
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/admin/evacuator-requests"
                    element={
                      user.role === "admin" ? (
                        <AdminEvacuatorRequests />
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                
                <Route
                  path="/admin/blog"
                  element={
                    user.role === "admin" ? (
                      <BlogManagement />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
              </Suspense>
            </div>
          </div>
        </main>
        
        {/* Mobile Bottom Navigation */}
        <div className="md:hidden">
          <MobileBottomNav />
        </div>
      </div>
    );
  } catch (error) {
    console.error("🏠 Error rendering Dashboard:", error);
    return (
      <Layout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600 mb-2">დაფიქსირდა შეცდომა</h1>
          <p className="text-gray-600">გთხოვთ განაახლოთ გვერდი</p>
        </div>
      </Layout>
    );
  }
};

export default Dashboard;
