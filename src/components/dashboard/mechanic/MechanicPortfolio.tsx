
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { toast } from "sonner";
import { AspectRatio } from "@/components/ui/aspect-ratio";

type PortfolioItem = {
  id: number;
  title: string;
  description: string;
  images: string[];
  created_at: string;
  mechanic_id: string;
};

const MechanicPortfolio = () => {
  const { user } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImages, setSelectedImages] = useState<FileList | null>(null);

  useEffect(() => {
    if (user) {
      fetchPortfolioItems();
    }
  }, [user]);

  const fetchPortfolioItems = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("portfolio")
        .select("*")
        .eq("mechanic_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Convert any JSON images field to string array
      const formattedData = data?.map(item => ({
        ...item,
        images: Array.isArray(item.images) 
          ? item.images.map(img => String(img)) 
          : []
      })) as PortfolioItem[];
      
      setPortfolioItems(formattedData || []);
    } catch (error) {
      console.error("Error fetching portfolio items:", error);
      toast.error("პორტფოლიოს ჩატვირთვისას შეცდომა დაფიქსირდა");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!user || !title.trim()) return;

    try {
      // For now, just create a dummy portfolio item
      // In a real implementation, you'd upload images first
      const { data, error } = await supabase
        .from("portfolio")
        .insert({
          title,
          description,
          mechanic_id: user.id,
          images: [] // No images for now
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("პორტფოლიოს ელემენტი წარმატებით დაემატა");
      setPortfolioItems([{ ...data, images: [] }, ...portfolioItems]);
      resetForm();
    } catch (error) {
      console.error("Error adding portfolio item:", error);
      toast.error("პორტფოლიოს დამატებისას შეცდომა დაფიქსირდა");
    }
  };

  const handleEditItem = (item: PortfolioItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setOpenDialog(true);
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !title.trim()) return;

    try {
      const { error } = await supabase
        .from("portfolio")
        .update({
          title,
          description
        })
        .eq("id", editingItem.id);

      if (error) throw error;

      const updatedItems = portfolioItems.map(item =>
        item.id === editingItem.id
          ? { ...item, title, description }
          : item
      );

      setPortfolioItems(updatedItems);
      toast.success("პორტფოლიოს ელემენტი წარმატებით განახლდა");
      resetForm();
    } catch (error) {
      console.error("Error updating portfolio item:", error);
      toast.error("პორტფოლიოს განახლებისას შეცდომა დაფიქსირდა");
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      const { error } = await supabase
        .from("portfolio")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPortfolioItems(portfolioItems.filter(item => item.id !== id));
      toast.success("პორტფოლიოს ელემენტი წაიშალა");
    } catch (error) {
      console.error("Error deleting portfolio item:", error);
      toast.error("პორტფოლიოს წაშლისას შეცდომა დაფიქსირდა");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedImages(null);
    setEditingItem(null);
    setOpenDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">პორტფოლიო</h2>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> დამატება
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "პორტფოლიოს განახლება" : "პორტფოლიოს დამატება"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="title">სათაური</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="description">აღწერა</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="images">ფოტოები</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setSelectedImages(e.target.files)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  შეგიძლიათ აირჩიოთ რამდენიმე ფოტო (მაქს. 5)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                გაუქმება
              </Button>
              <Button
                onClick={editingItem ? handleUpdateItem : handleAddItem}
              >
                {editingItem ? "განახლება" : "დამატება"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted" />
              <CardContent className="pt-4">
                <div className="h-5 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-full mb-1" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : portfolioItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portfolioItems.map((item) => (
            <Card key={item.id}>
              {item.images.length > 0 ? (
                <AspectRatio ratio={16 / 9}>
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>
              ) : (
                <div className="bg-muted flex items-center justify-center h-48">
                  <p className="text-muted-foreground">ფოტო არ არის</p>
                </div>
              )}
              <CardContent className="pt-4">
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {item.description || "აღწერა არ არის მითითებული"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(item.created_at), "dd/MM/yyyy")}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between pt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditItem(item)}
                >
                  <Pencil className="h-4 w-4 mr-1" /> რედაქტირება
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> წაშლა
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-muted text-center p-8 rounded-lg">
          <p className="text-muted-foreground mb-4">
            თქვენს პორტფოლიოში ჯერ არ არის ელემენტები
          </p>
          <Button onClick={() => setOpenDialog(true)}>
            <Plus className="h-4 w-4 mr-1" /> დაამატეთ პირველი ელემენტი
          </Button>
        </div>
      )}
    </div>
  );
};

export default MechanicPortfolio;
