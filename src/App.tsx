
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/context/AuthContext";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { InstallPWA } from "@/components/mobile/InstallPWA";
import Index from "./pages/Index";

// Lazy load routes for better performance
const ServicesDetail = lazy(() => import("./pages/ServicesDetail"));
const ServiceSearch = lazy(() => import("./pages/ServiceSearch"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const Search = lazy(() => import("./pages/Search"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AddService = lazy(() => import("./pages/AddService"));
const Book = lazy(() => import("./pages/Book"));
const MechanicProfile = lazy(() => import("./pages/MechanicProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Chat = lazy(() => import("./pages/Chat"));
const Laundries = lazy(() => import("./pages/Laundries"));
const FuelImporters = lazy(() => import("./pages/FuelImporters"));
const Mechanics = lazy(() => import("./pages/Mechanics"));
const ServiceCategory = lazy(() => import("./pages/ServiceCategory"));
const CategoryList = lazy(() => import("./pages/CategoryList"));
const Map = lazy(() => import("./pages/Map"));
const SitemapXML = lazy(() => import("./pages/SitemapXML"));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          {/* <InstallPWA /> - Temporarily disabled to fix Service Worker issues */}
          <BrowserRouter>
            <ScrollToTop />
            <AuthProvider>
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              }>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/services" element={<ServicesDetail />} />
                  <Route path="/mechanic" element={<Mechanics />} />
                  <Route path="/service-search" element={<ServiceSearch />} />
                  <Route path="/service/:id" element={<ServiceDetail />} />
                  <Route path="/service/:slug" element={<ServiceDetail />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/map" element={<Map />} />
                  <Route path="/laundries" element={<Laundries />} />
                  <Route path="/fuel-importers" element={<FuelImporters />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/dashboard/*" element={<Dashboard />} />
                  <Route path="/add-service" element={<AddService />} />
                  <Route path="/book" element={<Book />} />
                  <Route path="/book/:mechanicId" element={<Book />} />
                  <Route path="/mechanic/:id" element={<MechanicProfile />} />
                  <Route path="/category" element={<CategoryList />} />
                  <Route path="/category/:categorySlug" element={<ServiceCategory />} />
                  <Route path="/services/:categorySlug" element={<ServiceCategory />} />
                  <Route path="/sitemap.xml" element={<SitemapXML />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
