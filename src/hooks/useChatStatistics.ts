
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ChatStatistics {
  roomId: string;
  participantCount: number;
  messageCount: number;
  lastActivity: string | null;
}

export const useChatStatistics = (roomId: string) => {
  return useQuery({
    queryKey: ["chat-statistics", roomId],
    queryFn: async () => {
      console.log('Fetching chat statistics for room:', roomId);
      
      // Get participant count
      const { count: participantCount, error: participantError } = await supabase
        .from("chat_participants")
        .select("*", { count: 'exact', head: true })
        .eq("room_id", roomId);

      if (participantError) {
        console.error('Error fetching participant count:', participantError);
        throw participantError;
      }

      // Get message count
      const { count: messageCount, error: messageError } = await supabase
        .from("messages")
        .select("*", { count: 'exact', head: true })
        .eq("room_id", roomId);

      if (messageError) {
        console.error('Error fetching message count:', messageError);
        throw messageError;
      }

      // Get last activity (most recent message)
      const { data: lastMessage, error: lastActivityError } = await supabase
        .from("messages")
        .select("created_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastActivityError) {
        console.error('Error fetching last activity:', lastActivityError);
        throw lastActivityError;
      }

      const statistics: ChatStatistics = {
        roomId,
        participantCount: participantCount || 0,
        messageCount: messageCount || 0,
        lastActivity: lastMessage?.created_at || null
      };

      console.log('Chat statistics:', statistics);
      return statistics;
    },
    enabled: !!roomId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
