
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
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // ჩატების ჩატვირთვა მონაწილეების ინფორმაციით
  const loadRooms = async () => {
    if (!user) return;

    console.log('🏠 Loading rooms for user:', user.id);

    const { data, error } = await supabase
      .from('chat_participants')
      .select(`
        chat_rooms (
          id,
          name,
          type,
          description,
          is_public
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Error loading rooms:', error);
      return;
    }

    console.log('📊 Raw rooms data:', data);

    if (data) {
      const roomsWithParticipants = await Promise.all(
        data
          .map(p => p.chat_rooms)
          .filter(Boolean)
          .map(async (room) => {
            let otherParticipant = null;
            
            // პირადი ჩატისთვის მოვძებნოთ მეორე მონაწილე
            if (room.type === 'direct') {
              const { data: participants, error: participantsError } = await supabase
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

              if (!participantsError && participants && participants.length > 0) {
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
      
      console.log('🏠 Processed rooms with participants:', roomsWithParticipants);
      setRooms(roomsWithParticipants);
    }
  };

  // მესიჯების ჩატვირთვა
  const loadMessages = async (roomId: string) => {
    console.log('💬 Loading messages for room:', roomId);

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
        ...msg,
        sender_name: `${msg.profiles?.first_name || ''} ${msg.profiles?.last_name || ''}`.trim() || 'Unknown'
      })));
    }
  };

  // მესიჯის გაგზავნა
  const sendMessage = async (content: string, fileUrl?: string, fileType?: 'image' | 'video' | 'file', fileName?: string) => {
    if (!activeRoom || !user) return;
    if (!content.trim() && !fileUrl) return;

    console.log('📤 Sending message:', { content, fileUrl, fileType, fileName, room: activeRoom.id, user: user.id });

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
  };

  // პირადი ჩატის შექმნა
  const createDirectChat = async (userId: string): Promise<ChatRoom | null> => {
    if (!user) {
      console.log('❌ No user for createDirectChat');
      return null;
    }

    console.log('🔄 Creating direct chat between:', user.id, 'and', userId);

    // ჯერ ვამოწმებთ არსებობს თუ არა
    console.log('🔍 Checking for existing direct chat...');
    const { data: existing, error: checkError } = await supabase
      .from('chat_participants')
      .select('room_id, chat_rooms!inner(*)')
      .eq('chat_rooms.type', 'direct')
      .in('user_id', [user.id, userId]);

    if (checkError) {
      console.error('❌ Error checking existing chats:', checkError);
    } else {
      console.log('🔍 Existing chat data:', existing);
    }

    if (existing && existing.length > 0) {
      // Check if both users are in the same room
      const roomCounts = existing.reduce((acc, row) => {
        acc[row.room_id] = (acc[row.room_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('📊 Room counts:', roomCounts);

      const sharedRoom = Object.keys(roomCounts).find(roomId => roomCounts[roomId] === 2);
      
      if (sharedRoom) {
        console.log('✅ Found existing shared room:', sharedRoom);
        const room = existing.find(row => row.room_id === sharedRoom)?.chat_rooms;
        if (room) {
          const chatRoom = {
            id: room.id,
            name: room.name,
            type: room.type as 'direct' | 'channel',
            description: room.description,
            is_public: room.is_public,
            other_participant: null
          };
          console.log('🎯 Returning existing chat room:', chatRoom);
          return chatRoom;
        }
      }
    }

    // ახალი პირადი ჩატის შექმნა
    console.log('🆕 Creating new direct chat room...');
    const { data: newRoom, error: createError } = await supabase
      .from('chat_rooms')
      .insert({
        type: 'direct',
        is_public: false,
        created_by: user.id
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating room:', createError);
      return null;
    }

    console.log('🎉 Created new room:', newRoom);

    if (newRoom) {
      // ორივე წევრის დამატება
      console.log('👥 Adding participants to room...');
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

      console.log('✅ Participants added successfully');

      const chatRoom = {
        id: newRoom.id,
        name: newRoom.name,
        type: newRoom.type as 'direct' | 'channel',
        description: newRoom.description,
        is_public: newRoom.is_public,
        other_participant: null
      };

      loadRooms();
      console.log('🎯 Returning new chat room:', chatRoom);
      return chatRoom;
    }

    return null;
  };

  // არხში შესვლა
  const joinChannel = async (roomId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('chat_participants')
      .insert({
        room_id: roomId,
        user_id: user.id
      });

    if (!error) {
      loadRooms();
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
              ...payload.new as Message,
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
        (payload) => {
          console.log('User presence update:', payload);
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
      loadRooms
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
