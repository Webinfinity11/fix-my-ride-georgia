
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ChatParticipant {
  id: string;
  user_id: string;
  room_id: string;
  joined_at: string;
  last_read_at: string | null;
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export const useChatParticipants = (roomId: string) => {
  return useQuery({
    queryKey: ["chat-participants", roomId],
    queryFn: async () => {
      if (!roomId) {
        console.log('❌ No room ID provided');
        return [];
      }

      console.log('👥 Fetching participants for room:', roomId);
      
      const { data, error } = await supabase
        .from("chat_participants")
        .select(`
          id,
          user_id,
          room_id,
          joined_at,
          last_read_at,
          profiles:user_id (
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq("room_id", roomId)
        .order("joined_at", { ascending: false });

      if (error) {
        console.error('❌ Error fetching chat participants:', error);
        throw new Error(`Participants fetch failed: ${error.message}`);
      }

      if (!data) {
        console.log('📝 No participants found for room:', roomId);
        return [];
      }

      const transformedData: ChatParticipant[] = data.map(participant => ({
        id: participant.id,
        user_id: participant.user_id,
        room_id: participant.room_id,
        joined_at: participant.joined_at,
        last_read_at: participant.last_read_at,
        profile: {
          first_name: participant.profiles?.first_name || 'უცნობი',
          last_name: participant.profiles?.last_name || 'მომხმარებელი',
          email: participant.profiles?.email || 'N/A',
          avatar_url: participant.profiles?.avatar_url || null,
        }
      }));

      console.log('✅ Participants fetched successfully:', transformedData.length);
      return transformedData;
    },
    enabled: !!roomId,
    staleTime: 1000 * 60 * 2,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useRemoveParticipant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ participantId, roomId }: { participantId: string; roomId: string }) => {
      console.log('🗑️ Removing participant:', participantId, 'from room:', roomId);
      
      const { error } = await supabase
        .from("chat_participants")
        .delete()
        .eq("id", participantId);

      if (error) {
        console.error('❌ Error removing participant:', error);
        throw new Error(`Failed to remove participant: ${error.message}`);
      }
      
      console.log('✅ Participant removed successfully');
      return { participantId, roomId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chat-participants", data.roomId] });
      queryClient.invalidateQueries({ queryKey: ["chat-statistics", data.roomId] });
      toast({
        title: "წარმატება",
        description: "მონაწილე წარმატებით წაიშალა",
      });
    },
    onError: (error: Error) => {
      console.error("❌ Remove participant error:", error);
      toast({
        title: "შეცდომა",
        description: error.message || "მონაწილის წაშლა ვერ მოხერხდა",
        variant: "destructive",
      });
    },
  });
};

export const useAddParticipant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, roomId }: { userId: string; roomId: string }) => {
      console.log('➕ Adding participant:', userId, 'to room:', roomId);
      
      const { data, error } = await supabase
        .from("chat_participants")
        .insert({
          user_id: userId,
          room_id: roomId
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding participant:', error);
        throw new Error(`Failed to add participant: ${error.message}`);
      }
      
      console.log('✅ Participant added successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      if (data?.room_id) {
        queryClient.invalidateQueries({ queryKey: ["chat-participants", data.room_id] });
        queryClient.invalidateQueries({ queryKey: ["chat-statistics", data.room_id] });
      }
      toast({
        title: "წარმატება",
        description: "მონაწილე წარმატებით დაემატა",
      });
    },
    onError: (error: Error) => {
      console.error("❌ Add participant error:", error);
      toast({
        title: "შეცდომა",
        description: error.message || "მონაწილის დამატება ვერ მოხერხდა",
        variant: "destructive",
      });
    },
  });
};
