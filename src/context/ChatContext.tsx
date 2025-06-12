
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface ChatRoom {
  id: string;
  name: string | null;
  type: 'direct' | 'channel';
  description?: string | null;
  is_public: boolean;
  unread_count?: number;
  other_participant?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  } | null;
}

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  file_url?: string;
  file_type?: 'image' | 'video' | 'file';
  file_name?: string;
}

interface ChatContextType {
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  messages: Message[];
  onlineUsers: string[];
  setActiveRoom: (room: ChatRoom | null) => void;
  sendMessage: (content: string, fileUrl?: string, fileType?: 'image' | 'video' | 'file', fileName?: string) => Promise<void>;
  createDirectChat: (userId: string) => Promise<ChatRoom | null>;
  joinChannel: (roomId: string) => Promise<void>;
  loadRooms: () => Promise<void>;
  createChannel: (name: string, description?: string, isPublic?: boolean) => Promise<ChatRoom | null>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // ჩატების ჩატვირთვა
  const loadRooms = async () => {
    if (!user) return;

    console.log('🏠 Loading rooms for user:', user.id);

    try {
      // Get rooms where user is a participant
      const { data: participantRooms, error: participantError } = await supabase
        .from('chat_participants')
        .select(`
          room_id,
          chat_rooms (
            id,
            name,
            type,
            description,
            is_public
          )
        `)
        .eq('user_id', user.id);

      if (participantError) {
        console.error('❌ Error loading participant rooms:', participantError);
        return;
      }

      // Also get public rooms
      const { data: publicRooms, error: publicError } = await supabase
        .from('chat_rooms')
        .select('id, name, type, description, is_public')
        .eq('is_public', true)
        .eq('type', 'channel');

      if (publicError) {
        console.error('❌ Error loading public rooms:', publicError);
        return;
      }

      // Combine rooms
      const userRoomIds = participantRooms?.map(p => p.chat_rooms?.id).filter(Boolean) || [];
      const allRoomsMap = new Map();

      // Add participant rooms
      participantRooms?.forEach(p => {
        if (p.chat_rooms) {
          allRoomsMap.set(p.chat_rooms.id, p.chat_rooms);
        }
      });

      // Add public rooms not already in participant rooms
      publicRooms?.forEach(room => {
        if (!allRoomsMap.has(room.id)) {
          allRoomsMap.set(room.id, room);
        }
      });

      const allRooms = Array.from(allRoomsMap.values());

      // Process rooms to add participant info for direct chats
      const roomsWithParticipants = await Promise.all(
        allRooms.map(async (room) => {
          let otherParticipant = null;
          
          if (room.type === 'direct') {
            const { data: participants } = await supabase
              .from('chat_participants')
              .select(`
                user_id,
                profiles (
                  id,
                  first_name,
                  last_name,
                  avatar_url
                )
              `)
              .eq('room_id', room.id)
              .neq('user_id', user.id);

            if (participants && participants.length > 0) {
              const participant = participants[0];
              if (participant.profiles) {
                otherParticipant = {
                  id: participant.profiles.id,
                  first_name: participant.profiles.first_name,
                  last_name: participant.profiles.last_name,
                  avatar_url: participant.profiles.avatar_url
                };
              }
            }
          }

          return {
            id: room.id,
            name: room.name,
            type: room.type as 'direct' | 'channel',
            description: room.description,
            is_public: room.is_public,
            other_participant: otherParticipant
          };
        })
      );
      
      console.log('🏠 Processed rooms:', roomsWithParticipants);
      setRooms(roomsWithParticipants);
    } catch (error) {
      console.error('❌ Error in loadRooms:', error);
    }
  };

  // მესიჯების ჩატვირთვა
  const loadMessages = async (roomId: string) => {
    console.log('💬 Loading messages for room:', roomId);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!sender_id (
            first_name,
            last_name
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('❌ Error loading messages:', error);
        return;
      }

      console.log('💬 Loaded messages:', data);

      if (data) {
        setMessages(data.map(msg => ({
          id: msg.id,
          room_id: msg.room_id,
          sender_id: msg.sender_id,
          content: msg.content,
          created_at: msg.created_at,
          file_url: msg.file_url,
          file_type: msg.file_type as 'image' | 'video' | 'file' | undefined,
          file_name: msg.file_name,
          sender_name: `${msg.profiles?.first_name || ''} ${msg.profiles?.last_name || ''}`.trim() || 'Unknown'
        })));
      }
    } catch (error) {
      console.error('❌ Error in loadMessages:', error);
    }
  };

  // მესიჯის გაგზავნა
  const sendMessage = async (content: string, fileUrl?: string, fileType?: 'image' | 'video' | 'file', fileName?: string) => {
    if (!activeRoom || !user) return;

    console.log('📤 Sending message:', { content, room: activeRoom.id, user: user.id, fileUrl, fileType, fileName });

    try {
      const messageData: any = {
        room_id: activeRoom.id,
        sender_id: user.id,
        content: content.trim()
      };

      if (fileUrl) {
        messageData.file_url = fileUrl;
        messageData.file_type = fileType;
        messageData.file_name = fileName;
      }

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) {
        console.error('❌ Error sending message:', error);
      } else {
        console.log('✅ Message sent successfully');
      }
    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
    }
  };

  // პირადი ჩატის შექმნა
  const createDirectChat = async (userId: string): Promise<ChatRoom | null> => {
    if (!user) return null;

    console.log('🔄 Creating direct chat between:', user.id, 'and', userId);

    try {
      // Check for existing direct chat
      const { data: existingRooms } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          name,
          type,
          description,
          is_public,
          chat_participants!inner(user_id)
        `)
        .eq('type', 'direct');

      // Find room where both users are participants
      const sharedRoom = existingRooms?.find(room => {
        const participantIds = room.chat_participants.map((p: any) => p.user_id);
        return participantIds.includes(user.id) && participantIds.includes(userId);
      });

      if (sharedRoom) {
        console.log('✅ Found existing direct chat:', sharedRoom.id);
        return {
          id: sharedRoom.id,
          name: sharedRoom.name,
          type: 'direct',
          description: sharedRoom.description,
          is_public: sharedRoom.is_public,
          other_participant: null
        };
      }

      // Create new direct chat
      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({
          type: 'direct',
          is_public: false,
          created_by: user.id
        })
        .select()
        .single();

      if (createError || !newRoom) {
        console.error('❌ Error creating room:', createError);
        return null;
      }

      // Add participants
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { room_id: newRoom.id, user_id: user.id },
          { room_id: newRoom.id, user_id: userId }
        ]);

      if (participantsError) {
        console.error('❌ Error adding participants:', participantsError);
        return null;
      }

      await loadRooms();
      return {
        id: newRoom.id,
        name: newRoom.name,
        type: 'direct',
        description: newRoom.description,
        is_public: newRoom.is_public,
        other_participant: null
      };
    } catch (error) {
      console.error('❌ Error in createDirectChat:', error);
      return null;
    }
  };

  // არხის შექმნა
  const createChannel = async (name: string, description?: string, isPublic: boolean = true): Promise<ChatRoom | null> => {
    if (!user) return null;

    console.log('📺 Creating channel:', { name, description, isPublic });

    try {
      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({
          name,
          description,
          type: 'channel',
          is_public: isPublic,
          created_by: user.id
        })
        .select()
        .single();

      if (createError || !newRoom) {
        console.error('❌ Error creating channel:', createError);
        return null;
      }

      // Add creator as participant
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert({
          room_id: newRoom.id,
          user_id: user.id
        });

      if (participantError) {
        console.error('❌ Error adding creator as participant:', participantError);
      }

      await loadRooms();
      return {
        id: newRoom.id,
        name: newRoom.name,
        type: 'channel',
        description: newRoom.description,
        is_public: newRoom.is_public,
        other_participant: null
      };
    } catch (error) {
      console.error('❌ Error in createChannel:', error);
      return null;
    }
  };

  // არხში შესვლა
  const joinChannel = async (roomId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_participants')
        .insert({
          room_id: roomId,
          user_id: user.id
        });

      if (!error) {
        await loadRooms();
      } else {
        console.error('❌ Error joining channel:', error);
      }
    } catch (error) {
      console.error('❌ Error in joinChannel:', error);
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscriptions for user:', user.id);

    // მესიჯების real-time მოსმენა
    const messageChannel = supabase
      .channel('messages_realtime')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        },
        async (payload) => {
          console.log('New message received:', payload);
          
          if (activeRoom && payload.new.room_id === activeRoom.id) {
            const { data: senderData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', payload.new.sender_id)
              .single();

            const newMessage: Message = {
              id: payload.new.id,
              room_id: payload.new.room_id,
              sender_id: payload.new.sender_id,
              content: payload.new.content,
              created_at: payload.new.created_at,
              file_url: payload.new.file_url,
              file_type: payload.new.file_type,
              file_name: payload.new.file_name,
              sender_name: senderData 
                ? `${senderData.first_name || ''} ${senderData.last_name || ''}`.trim() || 'Unknown'
                : 'Unknown'
            };

            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    // User presence real-time მოსმენა
    const presenceChannel = supabase
      .channel('user_presence_realtime')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        () => {
          loadOnlineUsers();
        }
      )
      .subscribe();

    // ონლაინ სტატუსის აღნიშვნა
    const updatePresence = async () => {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          is_online: true,
          last_seen: new Date().toISOString()
        });
    };

    // Load online users
    const loadOnlineUsers = async () => {
      const { data } = await supabase
        .from('user_presence')
        .select('user_id')
        .eq('is_online', true)
        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());

      if (data) {
        setOnlineUsers(data.map(row => row.user_id));
      }
    };

    updatePresence();
    loadOnlineUsers();
    const presenceInterval = setInterval(updatePresence, 30000);

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(presenceChannel);
      clearInterval(presenceInterval);
      
      supabase
        .from('user_presence')
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq('user_id', user.id);
    };
  }, [user, activeRoom?.id]);

  useEffect(() => {
    if (user) {
      loadRooms();
    }
  }, [user]);

  useEffect(() => {
    if (activeRoom) {
      loadMessages(activeRoom.id);
    }
  }, [activeRoom]);

  return (
    <ChatContext.Provider value={{
      rooms,
      activeRoom,
      messages,
      onlineUsers,
      setActiveRoom,
      sendMessage,
      createDirectChat,
      joinChannel,
      loadRooms,
      createChannel
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
