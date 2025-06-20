
import React, { useState } from "react";
import { useCreateChatRoom } from "@/hooks/useCreateChatRoom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { CreateChatRoomData } from "@/hooks/useCreateChatRoom";
import { useChat } from "@/context/ChatContext";

export const CreateChatButton = () => {
  const [open, setOpen] = useState(false);
  const createChatRoom = useCreateChatRoom();
  const { loadRooms } = useChat();

  const form = useForm<CreateChatRoomData>({
    defaultValues: {
      name: "",
      type: "channel",
      description: "",
      is_public: true,
    },
  });

  const onSubmit = (data: CreateChatRoomData) => {
    createChatRoom.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        loadRooms(); // Reload rooms to show the new chat
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          ახალი ჩატი
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ახალი ჩატის შექმნა</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>სახელი *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ჩატის სახელი..." 
                      {...field} 
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ტიპი</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="აირჩიეთ ტიპი" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="channel">არხი (საჯარო)</SelectItem>
                      <SelectItem value="direct">პირადი ჩატი</SelectItem>
                    </SelectContent>
                  </Select>
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

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={createChatRoom.isPending}
              >
                გაუქმება
              </Button>
              <Button 
                type="submit" 
                disabled={createChatRoom.isPending}
              >
                {createChatRoom.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    შექმნა...
                  </>
                ) : (
                  "შექმნა"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
