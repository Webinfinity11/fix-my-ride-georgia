
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
}

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

interface ChatContextType {
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  messages: Message[];
  onlineUsers: string[];
  setActiveRoom: (room: ChatRoom | null) => void;
  sendMessage: (content: string) => Promise<void>;
  createDirectChat: (userId: string) => Promise<void>;
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

  // ჩატების ჩატვირთვა
  const loadRooms = async () => {
    if (!user) return;

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

    if (data) {
      const roomsData = data
        .map(p => p.chat_rooms)
        .filter(Boolean)
        .map(room => ({
          id: room.id,
          name: room.name,
          type: room.type as 'direct' | 'channel',
          description: room.description,
          is_public: room.is_public
        }));
      setRooms(roomsData);
    }
  };

  // მესიჯების ჩატვირთვა
  const loadMessages = async (roomId: string) => {
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

    if (data) {
      setMessages(data.map(msg => ({
        ...msg,
        sender_name: `${msg.profiles?.first_name || ''} ${msg.profiles?.last_name || ''}`.trim() || 'Unknown'
      })));
    }
  };

  // მესიჯის გაგზავნა
  const sendMessage = async (content: string) => {
    if (!activeRoom || !user || !content.trim()) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        room_id: activeRoom.id,
        sender_id: user.id,
        content: content.trim()
      });

    if (error) {
      console.error('Error sending message:', error);
    }
  };

  // პირადი ჩატის შექმნა
  const createDirectChat = async (userId: string) => {
    if (!user) return;

    // ჯერ ვამოწმებთ არსებობს თუ არა
    const { data: existing } = await supabase
      .from('chat_participants')
      .select('room_id, chat_rooms!inner(*)')
      .eq('chat_rooms.type', 'direct')
      .in('user_id', [user.id, userId]);

    if (existing && existing.length > 0) {
      // თუ არსებობს, ვხსნით
      const room = existing[0].chat_rooms;
      setActiveRoom({
        id: room.id,
        name: room.name,
        type: room.type as 'direct' | 'channel',
        description: room.description,
        is_public: room.is_public
      });
      return;
    }

    // ახალი პირადი ჩატის შექმნა
    const { data: newRoom, error } = await supabase
      .from('chat_rooms')
      .insert({
        type: 'direct',
        is_public: false,
        created_by: user.id
      })
      .select()
      .single();

    if (newRoom) {
      // ორივე წევრის დამატება
      await supabase.from('chat_participants').insert([
        { room_id: newRoom.id, user_id: user.id },
        { room_id: newRoom.id, user_id: userId }
      ]);

      setActiveRoom({
        id: newRoom.id,
        name: newRoom.name,
        type: newRoom.type as 'direct' | 'channel',
        description: newRoom.description,
        is_public: newRoom.is_public
      });
      loadRooms();
    }
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

    // მესიჯების მოსმენა
    const messageSubscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (activeRoom && payload.new.room_id === activeRoom.id) {
            loadMessages(activeRoom.id);
          }
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

    updatePresence();
    const presenceInterval = setInterval(updatePresence, 30000);

    return () => {
      messageSubscription.unsubscribe();
      clearInterval(presenceInterval);
    };
  }, [user, activeRoom]);

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
