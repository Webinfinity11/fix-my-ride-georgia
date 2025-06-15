
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UpdateChatRoomData {
  name?: string;
  description?: string;
  is_public?: boolean;
}

export const useUpdateChatRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ roomId, data }: { roomId: string; data: UpdateChatRoomData }) => {
      console.log('Updating chat room:', roomId, 'with data:', data);
      
      const { data: updatedRoom, error } = await supabase
        .from("chat_rooms")
        .update(data)
        .eq("id", roomId)
        .select()
        .single();

      if (error) {
        console.error('Error updating chat room:', error);
        throw error;
      }
      
      console.log('Successfully updated chat room:', updatedRoom);
      return updatedRoom;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-chat-rooms"] });
      toast({
        title: "წარმატება",
        description: "ჩატი წარმატებით განახლდა",
      });
    },
    onError: (error) => {
      console.error("ჩატის განახლების შეცდომა:", error);
      toast({
        title: "შეცდომა",
        description: "ჩატის განახლება ვერ მოხერხდა",
        variant: "destructive",
      });
    },
  });
};
