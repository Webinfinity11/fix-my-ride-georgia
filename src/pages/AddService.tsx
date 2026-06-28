
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import ServiceForm from "@/components/forms/ServiceForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VIPRequestCard } from "@/components/dashboard/mechanic/VIPRequestCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

type ServiceCategoryType = {
  id: number;
  name: string;
  description: string | null;
};

const AddService = () => {
  const { user, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ServiceCategoryType[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [newServiceId, setNewServiceId] = useState<number | null>(null);
  const [newServiceName, setNewServiceName] = useState<string>("");

  useEffect(() => {
    console.log('🏁 AddService page loaded, auth state:', { 
      user: user?.id, 
      role: user?.role, 
      loading, 
      initialized 
    });
    
    // Wait for auth to initialize before checking access
    if (initialized && !loading) {
      if (!user) {
        console.log('❌ No user found, redirecting to registration for mechanics');
        toast.error("სერვისის დასამატებლად გაიარეთ რეგისტრაცია ხელოსნად");
        navigate("/register?type=mechanic");
        return;
      }
      
      if (user.role !== "mechanic") {
        console.log('❌ User is not a mechanic, redirecting to dashboard services');
        toast.error("მხოლოდ მექანიკოსებს შეუძლიათ სერვისის დამატება");
        navigate("/dashboard/services");
        return;
      }
      
      console.log('✅ Mechanic access granted');
    }
  }, [user, loading, initialized, navigate]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      console.log('📋 Fetching service categories');
      const { data, error } = await supabase
        .from("service_categories")
        .select("id, name, description")
        .order("name", { ascending: true });

      if (error) throw error;
      console.log('✅ Categories loaded:', data?.length);
      setCategories(data || []);
    } catch (error: any) {
      console.error('❌ Categories fetch error:', error);
      toast.error(`კატეგორიების ჩატვირთვა ვერ მოხერხდა: ${error.message}`);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleFormSubmit = async (serviceId?: number) => {
    console.log('✅ Service added successfully', serviceId);
    
    if (serviceId) {
      // Fetch service name
      try {
        const { data } = await supabase
          .from("mechanic_services")
          .select("name")
          .eq("id", serviceId)
          .single();
        
        setNewServiceId(serviceId);
        setNewServiceName(data?.name || "");
        setShowSuccessDialog(true);
      } catch (error) {
        console.error("Error fetching service name:", error);
        navigate("/dashboard/services");
      }
    } else {
      navigate("/dashboard/services");
    }
  };

  const handleCancel = () => {
    console.log('❌ Service addition cancelled');
    navigate("/dashboard/services");
  };

  if (loading || loadingCategories || !initialized) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  if (!user || user.role !== "mechanic") return null;

  return (
    <Layout>
      <Helmet>
        <title>ახალი სერვისის დამატება | ავტოხელოსანი</title>
        <meta name="description" content="დაამატეთ ახალი ავტოსერვისი თქვენი პროფილისთვის." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://fixup.ge/add-service" />
      </Helmet>
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ახალი სერვისის დამატება</h1>
            <p className="text-gray-600">შეავსეთ ფორმა თქვენი ახალი სერვისის დასამატებლად</p>
          </div>
          
          <ServiceForm
            service={null}
            categories={categories}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>

      {/* Success Dialog with VIP Request Option */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="z-[100000] w-[calc(100%-1rem)] max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-xl p-3 gap-3 sm:max-w-[600px] sm:p-6 sm:gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-7 text-lg leading-snug sm:text-2xl">
              <CheckCircle className="h-5 w-5 shrink-0 text-green-500 sm:h-7 sm:w-7" />
              სერვისი წარმატებით დაემატა!
            </DialogTitle>
          </DialogHeader>
          
          {newServiceId && (
            <div className="space-y-3 py-1 sm:space-y-6 sm:py-4">
              <VIPRequestCard
                serviceId={newServiceId}
                serviceName={newServiceName}
              />

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setShowSuccessDialog(false);
                    navigate("/dashboard/services");
                  }}
                >
                  დასრულება
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AddService;
