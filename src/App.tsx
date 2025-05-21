
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MechanicProfile from "./pages/MechanicProfile";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import Services from "./pages/Services";
import About from "./pages/About";
import Contact from "./pages/Contact";

// Route guard for authenticated routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, initialized, loading } = useAuth();
  
  if (loading || !initialized) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/search" element={<Search />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/mechanic/:id" element={<MechanicProfile />} />
            <Route path="/dashboard/*" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            {/* Redirect /profile to the dashboard profile page */}
            <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
