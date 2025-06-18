
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminChatRoom {
  id: string;
  name: string | null;
  type: "channel" | "direct";
  description?: string | null;
  created_at?: string | null;
  is_public?: boolean | null;
}

export const useAdminChatRooms = () => {
  return useQuery({
    queryKey: ["admin-chat-rooms"],
    queryFn: async () => {
      console.log('Fetching admin chat rooms...');
      
      const { data, error } = await supabase
        .from("chat_rooms")
        .select("id, name, type, description, created_at, is_public")
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Error fetching chat rooms:', error);
        throw error;
      }
      
      console.log('Successfully fetched chat rooms:', data?.length || 0, 'rooms');
      return data as AdminChatRoom[];
    },
    retry: 2,
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
};
