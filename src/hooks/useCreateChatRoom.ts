
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CreateChatRoomData {
  name: string;
  type: "channel" | "direct";
  description?: string;
  is_public?: boolean;
}

export const useCreateChatRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateChatRoomData) => {
      console.log('Creating chat room with data:', data);
      
      const { data: newRoom, error } = await supabase
        .from("chat_rooms")
        .insert([{
          name: data.name,
          type: data.type,
          description: data.description,
          is_public: data.is_public ?? true,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating chat room:', error);
        throw error;
      }
      
      console.log('Created chat room:', newRoom);
      return newRoom;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-chat-rooms"] });
      toast({
        title: "წარმატება",
        description: "ახალი ჩატი წარმატებით შეიქმნა",
      });
    },
    onError: (error) => {
      console.error("ჩატის შექმნის შეცდომა:", error);
      toast({
        title: "შეცდომა",
        description: "ჩატის შექმნა ვერ მოხერხდა",
        variant: "destructive",
      });
    },
  });
};
