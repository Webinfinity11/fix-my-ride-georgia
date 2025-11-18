import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { DriveForm } from "@/components/forms/DriveForm";
import { useDrives, useCreateDrive, useUpdateDrive, useDeleteDrive } from "@/hooks/useDrives";
import type { Database } from "@/integrations/supabase/types";

type Drive = Database["public"]["Tables"]["drives"]["Row"];
type DriveInsert = Database["public"]["Tables"]["drives"]["Insert"];

export const DriveManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDrive, setEditingDrive] = useState<Drive | null>(null);

  const { data: drives, isLoading } = useDrives();
  const createMutation = useCreateDrive();
  const updateMutation = useUpdateDrive();
  const deleteMutation = useDeleteDrive();

  const handleCreate = async (data: DriveInsert) => {
    await createMutation.mutateAsync(data);
    setIsCreateOpen(false);
  };

  const handleUpdate = async (data: DriveInsert) => {
    if (!editingDrive) return;
    await updateMutation.mutateAsync({ ...data, id: editingDrive.id });
    setEditingDrive(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm("დარწმუნებული ხართ რომ გსურთ წაშლა?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">იტვირთება...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">დრაივების მართვა</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              დრაივის დამატება
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ახალი დრაივის დამატება</DialogTitle>
            </DialogHeader>
            <DriveForm
              onSubmit={handleCreate}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>დრაივების სია ({drives?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>დასახელება</TableHead>
                <TableHead>მისამართი</TableHead>
                <TableHead>ტელეფონი</TableHead>
                <TableHead>ფოტოები</TableHead>
                <TableHead className="text-right">მოქმედება</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drives?.map((drive) => (
                <TableRow key={drive.id}>
                  <TableCell className="font-medium">{drive.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {drive.address || "-"}
                    </div>
                  </TableCell>
                  <TableCell>{drive.contact_number || "-"}</TableCell>
                  <TableCell>{drive.photos?.length || 0}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Dialog
                      open={editingDrive?.id === drive.id}
                      onOpenChange={(open) => !open && setEditingDrive(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingDrive(drive)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>დრაივის რედაქტირება</DialogTitle>
                        </DialogHeader>
                        <DriveForm
                          onSubmit={handleUpdate}
                          initialData={drive}
                          isLoading={updateMutation.isPending}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(drive.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!drives?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    დრაივები ვერ მოიძებნა
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
