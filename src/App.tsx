import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { Preloader } from "@/components/performance/Preloader";
import { AuthProvider } from "@/context/AuthContext";
import { SEOMonitor } from "@/components/seo/SEOMonitor";
import ScrollToTop from "@/components/layout/ScrollToTop";
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
import AddService from "./pages/AddService";
import Book from "./pages/Book";
import MechanicProfile from "./pages/MechanicProfile";
import NotFound from "./pages/NotFound";
import Chat from "./pages/Chat";
import Laundries from "./pages/Laundries";
import Mechanics from "./pages/Mechanics";
import ServiceCategory from "./pages/ServiceCategory";
import CategoryList from "./pages/CategoryList";
import Map from "./pages/Map";
import SitemapXML from "./pages/SitemapXML";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <HelmetProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Preloader
                resources={[
                  '/fixup-og-image.jpg',
                  '/icons/service-pin.svg'
                ]}
                fonts={[]}
                critical={true}
              />
              <ScrollToTop />
              <SEOMonitor />
              <AuthProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/services" element={<ServicesDetail />} />
                  <Route path="/mechanics" element={<Mechanics />} />
                  <Route path="/mechanic" element={<Mechanics />} />
                  <Route path="/service-search" element={<ServiceSearch />} />
                  <Route path="/service/:slug" element={<ServiceDetail />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/map" element={<Map />} />
                  <Route path="/laundries" element={<Laundries />} />
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
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </HelmetProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;