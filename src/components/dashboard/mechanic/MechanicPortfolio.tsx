
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Images, Edit, Trash2, Plus, Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type PortfolioItem = {
  id: number;
  mechanic_id: string;
  title: string;
  description: string | null;
  images: string[] | null;
  created_at: string;
};

const MechanicPortfolio = () => {
  const { user } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formItem, setFormItem] = useState<Partial<PortfolioItem>>({
    title: "",
    description: "",
    images: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      console.error("Error fetching portfolio items:", error);
      toast.error(`პორტფოლიოს ჩატვირთვა ვერ მოხერხდა: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (item?: PortfolioItem) => {
    if (item) {
      setFormItem({
        id: item.id,
        title: item.title,
        description: item.description,
        images: item.images
      });
    } else {
      setFormItem({
        title: "",
        description: "",
        images: []
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormItem({
      title: "",
      description: "",
      images: []
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    if (!formItem.title) {
      toast.error("გთხოვთ შეავსოთ სახელი");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (formItem.id) {
        // Update existing item
        const { error } = await supabase
          .from("portfolio_items")
          .update({
            title: formItem.title,
            description: formItem.description,
            // For a real implementation, you would have image upload and updating
            // images: formItem.images
          })
          .eq("id", formItem.id)
          .eq("mechanic_id", user.id);
        
        if (error) throw error;
        
        toast.success("პორტფოლიოს ელემენტი განახლდა");
      } else {
        // Insert new item
        const { error } = await supabase
          .from("portfolio_items")
          .insert({
            mechanic_id: user.id,
            title: formItem.title,
            description: formItem.description,
            images: [] // For a real implementation, you would have image upload
          });
        
        if (error) throw error;
        
        toast.success("პორტფოლიოს ელემენტი დაემატა");
      }
      
      handleCloseForm();
      fetchPortfolioItems();
    } catch (error: any) {
      console.error("Error saving portfolio item:", error);
      toast.error(`შენახვა ვერ მოხერხდა: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("დარწმუნებული ხართ, რომ გსურთ ამ ელემენტის წაშლა?")) return;
    
    try {
      const { error } = await supabase
        .from("portfolio_items")
        .delete()
        .eq("id", id)
        .eq("mechanic_id", user?.id);
      
      if (error) throw error;
      
      setPortfolioItems(portfolioItems.filter(item => item.id !== id));
      toast.success("ელემენტი წაიშალა");
    } catch (error: any) {
      console.error("Error deleting portfolio item:", error);
      toast.error(`წაშლა ვერ მოხერხდა: ${error.message}`);
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
        <Button onClick={() => handleOpenForm()}>
          <Plus size={16} className="mr-2" />
          დამატება
        </Button>
      </div>

      {portfolioItems.length === 0 ? (
        <div className="bg-muted p-8 rounded-lg text-center">
          <Images size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">პორტფოლიო ცარიელია</h3>
          <p className="text-muted-foreground mb-4">
            დაამატეთ თქვენი ნამუშევრები პორტფოლიოში
          </p>
          <Button onClick={() => handleOpenForm()}>
            დაამატეთ პირველი ელემენტი
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {portfolioItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="h-48 bg-muted flex items-center justify-center">
                {item.images && item.images.length > 0 ? (
                  <img 
                    src={item.images[0]} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Images size={48} className="text-muted-foreground" />
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium">{item.title}</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenForm(item)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                {item.description && (
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {formItem.id ? "პორტფოლიოს ელემენტის რედაქტირება" : "პორტფოლიოს ელემენტის დამატება"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">სათაური *</Label>
              <Input
                id="title"
                name="title"
                value={formItem.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">აღწერა</Label>
              <Textarea
                id="description"
                name="description"
                value={formItem.description || ""}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label>სურათები</Label>
              <div className="border border-dashed border-gray-300 rounded-md p-6 text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  დააჭირეთ სურათის ასატვირთად ან ჩააგდეთ აქ
                </p>
                <Button type="button" variant="outline" size="sm">
                  აირჩიეთ ფაილი
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  სურათების ატვირთვის ფუნქციონალი მალე იქნება ხელმისაწვდომი
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                გაუქმება
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "მიმდინარეობს..." : "შენახვა"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MechanicPortfolio;
