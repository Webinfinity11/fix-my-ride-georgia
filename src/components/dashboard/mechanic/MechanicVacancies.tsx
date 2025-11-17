import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Briefcase, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Vacancy {
  id: number;
  title: string;
  description: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

const MechanicVacancies = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    is_active: true,
  });

  const fetchVacancies = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('mechanic_vacancies')
      .select('*')
      .eq('mechanic_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Vacancy[];
  };

  const { data: vacancies = [], isLoading } = useQuery({
    queryKey: ['mechanic-vacancies'],
    queryFn: fetchVacancies,
  });

  const createVacancy = useMutation({
    mutationFn: async (data: { title: string; description: string; is_active: boolean }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      const { data: result, error } = await supabase
        .from('mechanic_vacancies')
        .insert([{
          mechanic_id: session.user.id,
          title: data.title,
          description: data.description,
          is_active: data.is_active,
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanic-vacancies'] });
      toast.success('ვაკანსია წარმატებით დაემატა');
      handleCloseDialog();
    },
    onError: (error: any) => {
      console.error('Error creating vacancy:', error);
      toast.error('ვაკანსიის დამატებისას შეცდომა დაფიქსირდა');
    },
  });

  const updateVacancy = useMutation({
    mutationFn: async (data: { id: number; title: string; description: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('mechanic_vacancies')
        .update({
          title: data.title,
          description: data.description,
          is_active: data.is_active,
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanic-vacancies'] });
      toast.success('ვაკანსია წარმატებით განახლდა');
      handleCloseDialog();
    },
    onError: (error: any) => {
      console.error('Error updating vacancy:', error);
      toast.error('ვაკანსიის განახლებისას შეცდომა დაფიქსირდა');
    },
  });

  const deleteVacancy = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('mechanic_vacancies')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanic-vacancies'] });
      toast.success('ვაკანსია წარმატებით წაიშალა');
    },
    onError: (error: any) => {
      console.error('Error deleting vacancy:', error);
      toast.error('ვაკანსიის წაშლისას შეცდომა დაფიქსირდა');
    },
  });

  const handleOpenDialog = (vacancy?: Vacancy) => {
    if (vacancy) {
      setEditingVacancy(vacancy);
      setFormData({
        title: vacancy.title,
        description: vacancy.description || "",
        is_active: vacancy.is_active ?? true,
      });
    } else {
      setEditingVacancy(null);
      setFormData({
        title: "",
        description: "",
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingVacancy(null);
    setFormData({
      title: "",
      description: "",
      is_active: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('გთხოვთ შეიყვანოთ ვაკანსიის დასახელება');
      return;
    }

    if (editingVacancy) {
      updateVacancy.mutate({
        id: editingVacancy.id,
        ...formData,
      });
    } else {
      createVacancy.mutate(formData);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('დარწმუნებული ხართ, რომ გსურთ ამ ვაკანსიის წაშლა?')) {
      return;
    }
    deleteVacancy.mutate(id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ka-GE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">ვაკანსიები</h2>
          <p className="text-sm text-muted-foreground mt-1">
            დაამატეთ და მართეთ თქვენი სამუშაო ვაკანსიები
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          ახალი ვაკანსია
        </Button>
      </div>

      {vacancies.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              თქვენ ჯერ არ გაქვთ დამატებული ვაკანსიები
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              პირველი ვაკანსიის დამატება
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vacancies.map(vacancy => (
            <Card key={vacancy.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      {vacancy.title}
                    </h3>
                    <Badge
                      variant={vacancy.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {vacancy.is_active ? "აქტიური" : "არააქტიური"}
                    </Badge>
                  </div>
                </div>

                {vacancy.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {vacancy.description}
                  </p>
                )}

                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
                  <Calendar className="h-3 w-3" />
                  <span>შეიქმნა: {formatDate(vacancy.created_at)}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(vacancy)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    რედაქტირება
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(vacancy.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingVacancy ? "ვაკანსიის რედაქტირება" : "ახალი ვაკანსიის დამატება"}
              </DialogTitle>
              <DialogDescription>
                შეავსეთ ვაკანსიის დეტალები
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  ვაკანსიის დასახელება <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="მაგ: ხელოსანი საბურავების შეკეთებისთვის"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">სამუშაოს აღწერა</Label>
                <Textarea
                  id="description"
                  placeholder="დაწერეთ სამუშაოს დეტალური აღწერა..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  აღწერეთ სამუშაოს მოთხოვნები, კვალიფიკაცია და სხვა მნიშვნელოვანი დეტალები
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  აქტიური ვაკანსია
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                გაუქმება
              </Button>
              <Button
                type="submit"
                disabled={createVacancy.isPending || updateVacancy.isPending}
              >
                {createVacancy.isPending || updateVacancy.isPending ? "შენახვა..." : "შენახვა"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MechanicVacancies;
