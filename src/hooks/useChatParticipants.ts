
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
      console.log('Fetching participants for room:', roomId);
      
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
        console.error('Error fetching chat participants:', error);
        throw error;
      }

      // Transform the data to match our interface
      const transformedData = data?.map(participant => ({
        id: participant.id,
        user_id: participant.user_id,
        room_id: participant.room_id,
        joined_at: participant.joined_at,
        last_read_at: participant.last_read_at,
        profile: participant.profiles as {
          first_name: string;
          last_name: string;
          email: string;
          avatar_url: string | null;
        }
      })) || [];

      console.log('Fetched participants:', transformedData.length);
      return transformedData as ChatParticipant[];
    },
    enabled: !!roomId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useRemoveParticipant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ participantId, roomId }: { participantId: string; roomId: string }) => {
      console.log('Removing participant:', participantId, 'from room:', roomId);
      
      const { error } = await supabase
        .from("chat_participants")
        .delete()
        .eq("id", participantId);

      if (error) {
        console.error('Error removing participant:', error);
        throw error;
      }
      
      console.log('Successfully removed participant');
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
    onError: (error) => {
      console.error("მონაწილის წაშლის შეცდომა:", error);
      toast({
        title: "შეცდომა",
        description: "მონაწილის წაშლა ვერ მოხერხდა",
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
      console.log('Adding participant:', userId, 'to room:', roomId);
      
      const { data, error } = await supabase
        .from("chat_participants")
        .insert({
          user_id: userId,
          room_id: roomId
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding participant:', error);
        throw error;
      }
      
      console.log('Successfully added participant:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chat-participants", data.room_id] });
      queryClient.invalidateQueries({ queryKey: ["chat-statistics", data.room_id] });
      toast({
        title: "წარმატება",
        description: "მონაწილე წარმატებით დაემატა",
      });
    },
    onError: (error) => {
      console.error("მონაწილის დამატების შეცდომა:", error);
      toast({
        title: "შეცდომა",
        description: "მონაწილის დამატება ვერ მოხერხდა",
        variant: "destructive",
      });
    },
  });
};
