import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import ServicesDetail from "./pages/ServicesDetail";
import ServiceSearch from "./pages/ServiceSearch";
import ServiceDetail from "./pages/ServiceDetail";
import Search from "./pages/Search";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Book from "./pages/Book";
import MechanicProfile from "./pages/MechanicProfile";
import NotFound from "./pages/NotFound";
import AddService from "./pages/AddService";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/services-detail" element={<ServicesDetail />} />
              <Route path="/service-search" element={<ServiceSearch />} />
              <Route path="/service/:id" element={<ServiceDetail />} />
              <Route path="/search" element={<Search />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard/*" element={<Dashboard />} />
              <Route path="/dashboard/add-service" element={<AddService />} />
              <Route path="/book" element={<Book />} />
              <Route path="/book/:mechanicId" element={<Book />} />
              <Route path="/mechanic/:id" element={<MechanicProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
