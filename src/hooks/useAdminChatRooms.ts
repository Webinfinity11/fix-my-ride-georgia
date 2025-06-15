
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminChatRoom {
  id: string;
  name: string | null;
  type: "channel" | "direct";
  description?: string | null;
  created_at?: string | null;
}

export const useAdminChatRooms = () => {
  return useQuery({
    queryKey: ["admin-chat-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_rooms")
        .select("id, name, type, description, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AdminChatRoom[];
    },
  });
};
