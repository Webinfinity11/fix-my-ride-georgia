
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDeleteChatRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      console.log('🗑️ Deleting chat room:', roomId);

      // Delete participants first
      const { error: participantsError } = await supabase
        .from("chat_participants")
        .delete()
        .eq("room_id", roomId);

      if (participantsError) {
        console.error('❌ Error deleting participants:', participantsError);
        throw new Error(`Failed to delete participants: ${participantsError.message}`);
      }

      // Delete messages
      const { error: messagesError } = await supabase
        .from("messages")
        .delete()
        .eq("room_id", roomId);

      if (messagesError) {
        console.error('❌ Error deleting messages:', messagesError);
        throw new Error(`Failed to delete messages: ${messagesError.message}`);
      }

      // Delete room
      const { error: roomError } = await supabase
        .from("chat_rooms")
        .delete()
        .eq("id", roomId);

      if (roomError) {
        console.error('❌ Error deleting room:', roomError);
        throw new Error(`Failed to delete room: ${roomError.message}`);
      }

      console.log('✅ Chat room deleted successfully');
      return roomId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-chat-rooms"] });
      toast.success("ჩატის ოთახი წარმატებით წაიშალა");
    },
    onError: (error: Error) => {
      console.error("❌ Delete room error:", error);
      toast.error(error.message || "ჩატის ოთახის წაშლა ვერ მოხერხდა");
    },
  });
};
