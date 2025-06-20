
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CreateChatRoomData {
  name: string;
  type: "channel" | "direct";
  description?: string;
  is_public?: boolean;
}

export const useCreateChatRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateChatRoomData) => {
      console.log('🏗️ Creating chat room:', data);

      // მივიღოთ მიმდინარე მომხმარებლის ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('ავტორიზაცია საჭიროა ჩატის შესაქმნელად');
      }

      // შევქმნათ ჩატის ოთახი
      const { data: room, error } = await supabase
        .from("chat_rooms")
        .insert({
          name: data.name,
          type: data.type,
          description: data.description,
          is_public: data.is_public ?? true,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating chat room:', error);
        throw new Error(`Room creation failed: ${error.message}`);
      }

      console.log('✅ Chat room created successfully:', room);

      // დავამატოთ შემქმნელი, როგორც მონაწილე
      const { error: participantError } = await supabase
        .from("chat_participants")
        .insert({
          room_id: room.id,
          user_id: user.id
        });

      if (participantError) {
        console.error('❌ Error adding creator as participant:', participantError);
        // არ გავაჩერებთ მთლიან პროცესს, მაგრამ ლოგავს შეცდომას
      }

      return room;
    },
    onSuccess: () => {
      // განაახლებს ყველა რელევანტურ query-ს
      queryClient.invalidateQueries({ queryKey: ["admin-chat-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
      toast.success("ჩატის ოთახი წარმატებით შეიქმნა");
    },
    onError: (error: Error) => {
      console.error("❌ Create room error:", error);
      toast.error(error.message || "ჩატის ოთახის შექმნა ვერ მოხერხდა");
    },
  });
};
