
import React from "react";
import { useUpdateChatRoom, UpdateChatRoomData } from "@/hooks/useUpdateChatRoom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { AdminChatRoom } from "@/hooks/useAdminChatRooms";

type Props = {
  room: AdminChatRoom;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const EditChatDialog: React.FC<Props> = ({ room, open, onOpenChange }) => {
  const updateChatRoom = useUpdateChatRoom();

  const form = useForm<UpdateChatRoomData>({
    defaultValues: {
      name: room.name || "",
      description: room.description || "",
      is_public: room.is_public ?? true,
    },
  });

  const onSubmit = (data: UpdateChatRoomData) => {
    updateChatRoom.mutate(
      { roomId: room.id, data },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  // Reset form when room changes
  React.useEffect(() => {
    if (room) {
      form.reset({
        name: room.name || "",
        description: room.description || "",
        is_public: room.is_public ?? true,
      });
    }
  }, [room, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ჩატის რედაქტირება</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>სახელი</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ჩატის სახელი..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>აღწერა (არასავალდებულო)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="ჩატის აღწერა..." 
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ხელმისაწვდომობა</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "true")} 
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="აირჩიეთ ხელმისაწვდომობა" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">საჯარო</SelectItem>
                      <SelectItem value="false">პრივატული</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={updateChatRoom.isPending}
              >
                გაუქმება
              </Button>
              <Button 
                type="submit" 
                disabled={updateChatRoom.isPending}
              >
                {updateChatRoom.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    განახლება...
                  </>
                ) : (
                  "განახლება"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
