
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ServiceForm from "@/components/forms/ServiceForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ServiceCategoryType = {
  id: number;
  name: string;
  description: string | null;
};

const AddService = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ServiceCategoryType[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      toast.error("სერვისის დასამატებლად გაიარეთ ავტორიზაცია");
      navigate("/login");
    }
    
    if (!loading && user && user.role !== "mechanic") {
      toast.error("მხოლოდ მექანიკოსებს შეუძლიათ სერვისის დამატება");
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("id, name, description")
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast.error(`კატეგორიების ჩატვირთვა ვერ მოხერხდა: ${error.message}`);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleFormSubmit = () => {
    toast.success("სერვისი წარმატებით დაემატა!");
    navigate("/dashboard/services");
  };

  const handleCancel = () => {
    navigate("/dashboard/services");
  };

  if (loading || loadingCategories) {
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

  if (!user || user.role !== "mechanic") return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />
      <main className="flex-grow py-8">
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
      </main>
      <Footer />
    </div>
  );
};

export default AddService;
