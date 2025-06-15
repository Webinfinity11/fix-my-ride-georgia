
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatRoom {
  id: string;
  name: string | null;
  type: 'direct' | 'channel';
  description?: string | null;
  is_public: boolean;
  created_at: string;
  created_by?: string;
  participant_count?: number;
  message_count?: number;
}

interface ChatParticipant {
  id: string;
  user_id: string;
  room_id: string;
  joined_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const useChatManagement = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching chat rooms...');

      // Get all rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (roomsError) {
        console.error('❌ Error fetching rooms:', roomsError);
        throw roomsError;
      }

      console.log('📊 Found rooms:', roomsData?.length || 0);

      if (!roomsData) {
        setRooms([]);
        return;
      }

      // Get counts for each room
      const roomsWithCounts = await Promise.all(
        roomsData.map(async (room) => {
          try {
            // Get participant count
            const { count: participantCount } = await supabase
              .from('chat_participants')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', room.id);

            // Get message count
            const { count: messageCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', room.id);

            return {
              id: room.id,
              name: room.name,
              type: (room.type === 'direct' || room.type === 'channel') 
                ? room.type as 'direct' | 'channel' 
                : 'channel' as 'direct' | 'channel',
              description: room.description,
              is_public: room.is_public ?? true,
              created_at: room.created_at,
              created_by: room.created_by,
              participant_count: participantCount || 0,
              message_count: messageCount || 0
            };
          } catch (error) {
            console.error(`❌ Error getting counts for room ${room.id}:`, error);
            return {
              id: room.id,
              name: room.name,
              type: (room.type === 'direct' || room.type === 'channel') 
                ? room.type as 'direct' | 'channel' 
                : 'channel' as 'direct' | 'channel',
              description: room.description,
              is_public: room.is_public ?? true,
              created_at: room.created_at,
              created_by: room.created_by,
              participant_count: 0,
              message_count: 0
            };
          }
        })
      );

      console.log('✅ Processed rooms with counts:', roomsWithCounts.length);
      setRooms(roomsWithCounts);
    } catch (error: any) {
      console.error('❌ Error in fetchRooms:', error);
      toast.error('ჩატების ჩატვირთვისას შეცდომა: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async (roomId: string) => {
    setParticipantsLoading(true);
    try {
      console.log('👥 Fetching participants for room:', roomId);

      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          *,
          profiles(first_name, last_name, email)
        `)
        .eq('room_id', roomId);

      if (error) {
        console.error('❌ Error fetching participants:', error);
        throw error;
      }

      console.log('👥 Found participants:', data?.length || 0);

      const processedParticipants = data?.map(p => ({
        ...p,
        profile: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
      })) || [];

      setParticipants(processedParticipants);
    } catch (error: any) {
      console.error('❌ Error in fetchParticipants:', error);
      toast.error('მონაწილეების ჩატვირთვისას შეცდომა: ' + error.message);
    } finally {
      setParticipantsLoading(false);
    }
  };

  const createRoom = async (roomData: {
    name: string;
    description: string;
    type: 'direct' | 'channel';
    is_public: boolean;
  }) => {
    try {
      console.log('🆕 Creating new room:', roomData);

      const { error } = await supabase
        .from('chat_rooms')
        .insert([{
          name: roomData.name || null,
          description: roomData.description || null,
          type: roomData.type,
          is_public: roomData.is_public
        }]);

      if (error) {
        console.error('❌ Error creating room:', error);
        throw error;
      }

      console.log('✅ Room created successfully');
      toast.success('ჩატი წარმატებით შეიქმნა');
      await fetchRooms();
    } catch (error: any) {
      console.error('❌ Error in createRoom:', error);
      toast.error('ჩატის შექმნისას შეცდომა: ' + error.message);
      throw error;
    }
  };

  const updateRoom = async (roomId: string, roomData: {
    name: string;
    description: string;
    type: 'direct' | 'channel';
    is_public: boolean;
  }) => {
    try {
      console.log('✏️ Updating room:', roomId, roomData);

      const { error } = await supabase
        .from('chat_rooms')
        .update({
          name: roomData.name || null,
          description: roomData.description || null,
          type: roomData.type,
          is_public: roomData.is_public
        })
        .eq('id', roomId);

      if (error) {
        console.error('❌ Error updating room:', error);
        throw error;
      }

      console.log('✅ Room updated successfully');
      toast.success('ჩატი წარმატებით განახლდა');
      await fetchRooms();
    } catch (error: any) {
      console.error('❌ Error in updateRoom:', error);
      toast.error('ჩატის განახლებისას შეცდომა: ' + error.message);
      throw error;
    }
  };

  const deleteRoom = async (roomId: string) => {
    try {
      console.log('🗑️ Deleting room:', roomId);

      // Delete participants first
      await supabase.from('chat_participants').delete().eq('room_id', roomId);
      
      // Delete messages
      await supabase.from('messages').delete().eq('room_id', roomId);
      
      // Delete room
      const { error } = await supabase.from('chat_rooms').delete().eq('id', roomId);
      
      if (error) {
        console.error('❌ Error deleting room:', error);
        throw error;
      }

      console.log('✅ Room deleted successfully');
      toast.success('ჩატი წარმატებით წაიშალა');
      await fetchRooms();
      
      if (selectedRoomId === roomId) {
        setSelectedRoomId(null);
        setParticipants([]);
      }
    } catch (error: any) {
      console.error('❌ Error in deleteRoom:', error);
      toast.error('ჩატის წაშლისას შეცდომა: ' + error.message);
    }
  };

  const resetRoom = async (roomId: string) => {
    try {
      console.log('🔄 Resetting room messages:', roomId);

      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('room_id', roomId);
      
      if (error) {
        console.error('❌ Error resetting room:', error);
        throw error;
      }

      console.log('✅ Room reset successfully');
      toast.success('ჩატის ისტორია წარმატებით წაიშალა');
      await fetchRooms();
    } catch (error: any) {
      console.error('❌ Error in resetRoom:', error);
      toast.error('ჩატის რესეტისას შეცდომა: ' + error.message);
    }
  };

  const selectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    fetchParticipants(roomId);
  };

  const getStats = () => {
    const totalRooms = rooms.length;
    const totalChannels = rooms.filter(r => r.type === 'channel').length;
    const totalDirectChats = rooms.filter(r => r.type === 'direct').length;
    const totalMessages = rooms.reduce((sum, room) => sum + (room.message_count || 0), 0);
    const totalParticipants = rooms.reduce((sum, room) => sum + (room.participant_count || 0), 0);

    return {
      totalRooms,
      totalChannels,
      totalDirectChats,
      totalMessages,
      totalParticipants
    };
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoomId) {
      fetchParticipants(selectedRoomId);
    } else {
      setParticipants([]);
    }
  }, [selectedRoomId]);

  return {
    rooms,
    participants,
    loading,
    participantsLoading,
    selectedRoomId,
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    resetRoom,
    selectRoom,
    getStats
  };
};
