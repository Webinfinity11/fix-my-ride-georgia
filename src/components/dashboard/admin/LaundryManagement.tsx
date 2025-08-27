import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

// Temporary interface until Supabase types are updated
interface TempLaundry {
  id: number;
  name: string;
  description?: string;
  address?: string;
  contact_number?: string;
  latitude?: number;
  longitude: number;
  water_price?: number;
  foam_price?: number;
  wax_price?: number;
  box_count?: number;
  photos?: string[];
  videos?: string[];
  created_at?: string;
}

const LaundryManagement = () => {
  const [selectedLaundry, setSelectedLaundry] = useState<TempLaundry | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Temporary empty data until backend is ready
  const laundries: TempLaundry[] = [];
  const isLoading = false;

  const handleEdit = (laundry: TempLaundry) => {
    setSelectedLaundry(laundry);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedLaundry(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    console.log("Delete laundry:", id);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedLaundry(null);
  };

  if (isLoading) {
    return <div className="p-6">იტვირთება...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">სამრეცხაოების მართვა</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              ახალი სამრეცხაოს დამატება
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedLaundry ? "სამრეცხაოს რედაქტირება" : "ახალი სამრეცხაოს დამატება"}
              </DialogTitle>
            </DialogHeader>
            <div className="p-6">
              <p className="text-muted-foreground">
                სამრეცხაოს ფორმა დროებით არ არის ხელმისაწვდომი. 
                მონაცემთა ბაზის ტიპები განახლდება მალე.
              </p>
              <Button onClick={handleFormClose} className="mt-4">
                დახურვა
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {laundries?.map((laundry) => (
          <Card key={laundry.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{laundry.name}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(laundry)}
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
                          ეს მოქმედება შეუქცევადია. სამრეცხაო სამუდამოდ წაიშლება.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>გაუქმება</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(laundry.id)}
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
              {laundry.description && (
                <p className="text-sm text-muted-foreground">{laundry.description}</p>
              )}
              
              {laundry.address && (
                <p className="text-sm"><strong>მისამართი:</strong> {laundry.address}</p>
              )}
              
              {laundry.contact_number && (
                <p className="text-sm"><strong>ტელეფონი:</strong> {laundry.contact_number}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {laundry.water_price && (
                  <Badge variant="outline">წყალი: {laundry.water_price}₾</Badge>
                )}
                {laundry.foam_price && (
                  <Badge variant="outline">ქაფი: {laundry.foam_price}₾</Badge>
                )}
                {laundry.wax_price && (
                  <Badge variant="outline">ცვილი: {laundry.wax_price}₾</Badge>
                )}
              </div>

              {laundry.box_count && (
                <p className="text-sm"><strong>ბოქსების რაოდენობა:</strong> {laundry.box_count}</p>
              )}

              <div className="flex gap-2">
                <Badge variant="secondary">
                  ფოტოები: {laundry.photos?.length || 0}
                </Badge>
                <Badge variant="secondary">
                  ვიდეოები: {laundry.videos?.length || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!laundries?.length && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">სამრეცხაოები არ მოიძებნა</p>
            <Button onClick={handleAdd} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              პირველი სამრეცხაოს დამატება
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LaundryManagement;