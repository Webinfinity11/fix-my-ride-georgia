
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
      console.log('🏠 Admin fetching chat rooms...');
      
      const { data, error } = await supabase
        .from("chat_rooms")
        .select("id, name, type, description, created_at, is_public")
        .order("created_at", { ascending: false });

      if (error) {
        console.error('❌ Error fetching admin chat rooms:', error);
        throw new Error(`Chat rooms fetch failed: ${error.message}`);
      }
      
      console.log('✅ Admin chat rooms fetched:', data?.length || 0, 'rooms');
      return data as AdminChatRoom[] || [];
    },
    retry: 1,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
};
