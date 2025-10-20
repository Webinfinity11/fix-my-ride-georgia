import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useFuelImporters, useDeleteFuelImporter } from "@/hooks/useFuelImporters";
import FuelImporterForm from "@/components/forms/FuelImporterForm";
import { Database } from "@/integrations/supabase/types";

type FuelImporter = Database["public"]["Tables"]["fuel_importers"]["Row"];

const FuelImporterManagement = () => {
  const [selectedImporter, setSelectedImporter] = useState<FuelImporter | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { data: importers = [], isLoading } = useFuelImporters();
  const deleteMutation = useDeleteFuelImporter();

  const handleEdit = (importer: FuelImporter) => {
    setSelectedImporter(importer);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedImporter(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting fuel importer:", error);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedImporter(null);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedImporter(null);
  };

  if (isLoading) {
    return <div className="p-6">იტვირთება...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">საწვავის იმპორტიორების მართვა</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              ახალი კომპანიის დამატება
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedImporter ? "კომპანიის რედაქტირება" : "ახალი კომპანიის დამატება"}
              </DialogTitle>
            </DialogHeader>
            <FuelImporterForm 
              importer={selectedImporter}
              onSuccess={handleFormSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {importers?.map((importer) => (
          <Card key={importer.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{importer.name}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(importer)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>დარწმუნებული ხართ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          ეს მოქმედება შეუქცევადია. კომპანია სამუდამოდ წაიშლება.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>გაუქმება</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(importer.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          წაშლა
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {importer.logo_url && (
                <div className="h-24 flex items-center justify-center bg-muted rounded-lg p-2">
                  <img 
                    src={importer.logo_url} 
                    alt={importer.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}

              <div className="space-y-2">
                {importer.super_ron_98_price && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">სუპერი RON 98:</span>
                    <Badge variant="default" className="bg-green-600">
                      {importer.super_ron_98_price} ₾
                    </Badge>
                  </div>
                )}
                
                {importer.premium_ron_96_price && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">პრემიუმი RON 96:</span>
                    <Badge variant="default" className="bg-blue-600">
                      {importer.premium_ron_96_price} ₾
                    </Badge>
                  </div>
                )}
                
                {importer.regular_ron_93_price && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">რეგულარი RON 93:</span>
                    <Badge variant="secondary">
                      {importer.regular_ron_93_price} ₾
                    </Badge>
                  </div>
                )}
              </div>

              {!importer.super_ron_98_price && !importer.premium_ron_96_price && !importer.regular_ron_93_price && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  ფასები არ არის მითითებული
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {!importers?.length && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">კომპანიები არ მოიძებნა</p>
            <Button onClick={handleAdd} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              პირველი კომპანიის დამატება
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FuelImporterManagement;
