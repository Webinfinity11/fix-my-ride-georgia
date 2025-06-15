
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDeleteChatRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (roomId: string) => {
      console.log('Deleting chat room with ID:', roomId);
      
      const { error } = await supabase
        .from("chat_rooms")
        .delete()
        .eq("id", roomId);

      if (error) {
        console.error('Error deleting chat room:', error);
        throw error;
      }
      
      console.log('Successfully deleted chat room');
      return { id: roomId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-chat-rooms"] });
      toast({
        title: "წარმატება",
        description: "ჩატი წარმატებით წაიშალა",
      });
    },
    onError: (error) => {
      console.error("ჩატის წაშლის შეცდომა:", error);
      toast({
        title: "შეცდომა",
        description: "ჩატის წაშლა ვერ მოხერხდა",
        variant: "destructive",
      });
    },
  });
};
