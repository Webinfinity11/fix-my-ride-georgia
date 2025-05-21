
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Images, Edit, Trash2, Plus } from "lucide-react";

const MechanicPortfolio = () => {
  const { user } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPortfolioItems();
    }
  }, [user]);

  const fetchPortfolioItems = async () => {
    try {
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("mechanic_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPortfolioItems(data || []);
    } catch (error: any) {
      toast.error(`პორტფოლიოს ჩატვირთვა ვერ მოხერხდა: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ჩემი პორტფოლიო</h1>
        <Button>
          <Plus size={16} className="mr-2" />
          დამატება
        </Button>
      </div>

      <div className="bg-muted p-8 rounded-lg text-center">
        <Images size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">პორტფოლიო</h3>
        <p className="text-muted-foreground mb-4">
          პორტფოლიოს ფუნქციონალი მალე დაემატება!
        </p>
      </div>
    </div>
  );
};

export default MechanicPortfolio;
