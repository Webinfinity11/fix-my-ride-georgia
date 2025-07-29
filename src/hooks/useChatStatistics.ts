
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
      if (!roomId) {
        console.log('❌ No room ID for statistics');
        return null;
      }

      console.log('📊 Fetching chat statistics for room:', roomId);
      
      try {
        // Get participant count
        const { count: participantCount, error: participantError } = await supabase
          .from("chat_participants")
          .select("*", { count: 'exact', head: true })
          .eq("room_id", roomId);

        if (participantError) {
          console.error('❌ Error fetching participant count:', participantError);
          throw new Error(`Participant count failed: ${participantError.message}`);
        }

        // Get message count
        const { count: messageCount, error: messageError } = await supabase
          .from("messages")
          .select("*", { count: 'exact', head: true })
          .eq("room_id", roomId);

        if (messageError) {
          console.error('❌ Error fetching message count:', messageError);
          throw new Error(`Message count failed: ${messageError.message}`);
        }

        // Get last activity
        const { data: lastMessage, error: lastActivityError } = await supabase
          .from("messages")
          .select("created_at")
          .eq("room_id", roomId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastActivityError) {
          console.error('❌ Error fetching last activity:', lastActivityError);
          // Don't throw here, just log the error
        }

        const statistics: ChatStatistics = {
          roomId,
          participantCount: participantCount || 0,
          messageCount: messageCount || 0,
          lastActivity: lastMessage?.created_at || null
        };

        console.log('✅ Statistics fetched successfully:', statistics);
        return statistics;
      } catch (error) {
        console.error('❌ Statistics fetch error:', error);
        throw error;
      }
    },
    enabled: !!roomId,
    staleTime: 1000 * 60 * 1,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};
