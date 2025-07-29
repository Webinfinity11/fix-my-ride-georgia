
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UpdateChatRoomData {
  name?: string;
  description?: string;
  is_public?: boolean;
}

export const useUpdateChatRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, data }: { roomId: string; data: UpdateChatRoomData }) => {
      console.log('🔄 Updating chat room:', roomId, data);
      
      const { data: room, error } = await supabase
        .from("chat_rooms")
        .update(data)
        .eq("id", roomId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating chat room:', error);
        throw new Error(`Room update failed: ${error.message}`);
      }

      console.log('✅ Chat room updated successfully:', room);
      return room;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-chat-rooms"] });
      toast.success("ჩატის ოთახი წარმატებით განახლდა");
    },
    onError: (error: Error) => {
      console.error("❌ Update room error:", error);
      toast.error(error.message || "ჩატის ოთახის განახლება ვერ მოხერხდა");
    },
  });
};
