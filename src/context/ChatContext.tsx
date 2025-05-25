
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

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
  loading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // ჩატების ჩატვირთვა
  const loadRooms = async () => {
    if (!user) return;
    
    console.log("🔄 Loading chat rooms...");
    setLoading(true);

    try {
      const { data, error } = await supabase
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

      if (error) {
        console.error("❌ Error loading rooms:", error);
        throw error;
      }

      console.log("✅ Rooms data:", data);
      
      if (data) {
        const roomsData = data
          .map(p => p.chat_rooms)
          .filter(Boolean) as ChatRoom[];
        setRooms(roomsData);
      }
    } catch (error: any) {
      console.error("❌ Error in loadRooms:", error);
      toast.error("ჩატების ჩატვირთვისას შეცდომა დაფიქსირდა");
    } finally {
      setLoading(false);
    }
  };

  // მესიჯების ჩატვირთვა
  const loadMessages = async (roomId: string) => {
    console.log("📨 Loading messages for room:", roomId);
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:sender_id (
            first_name,
            last_name
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error("❌ Error loading messages:", error);
        throw error;
      }

      console.log("✅ Messages data:", data);

      if (data) {
        const messagesData = data.map(msg => ({
          ...msg,
          sender_name: msg.profiles ? 
            `${msg.profiles.first_name} ${msg.profiles.last_name}`.trim() : 
            'უცნობი მომხმარებელი'
        }));
        setMessages(messagesData);
      }
    } catch (error: any) {
      console.error("❌ Error in loadMessages:", error);
      toast.error("მესიჯების ჩატვირთვისას შეცდომა დაფიქსირდა");
    }
  };

  // მესიჯის გაგზავნა
  const sendMessage = async (content: string) => {
    if (!activeRoom || !user || !content.trim()) return;

    console.log("📤 Sending message:", content);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: activeRoom.id,
          sender_id: user.id,
          content: content.trim()
        });

      if (error) {
        console.error("❌ Error sending message:", error);
        throw error;
      }

      console.log("✅ Message sent successfully");
    } catch (error: any) {
      console.error("❌ Error in sendMessage:", error);
      toast.error("მესიჯის გაგზავნისას შეცდომა დაფიქსირდა");
    }
  };

  // პირადი ჩატის შექმნა
  const createDirectChat = async (userId: string) => {
    if (!user) return;

    console.log("👥 Creating direct chat with user:", userId);

    try {
      // ჯერ ვამოწმებთ არსებობს თუ არა
      const { data: existing, error: checkError } = await supabase
        .from('chat_participants')
        .select(`
          room_id,
          chat_rooms!inner (
            id,
            name,
            type,
            description,
            is_public
          )
        `)
        .eq('chat_rooms.type', 'direct');

      if (checkError) {
        console.error("❌ Error checking existing chat:", checkError);
        throw checkError;
      }

      // თუ არსებობს პირადი ჩატი ამ მომხმარებელთან
      if (existing && existing.length > 0) {
        for (const room of existing) {
          const { data: participants } = await supabase
            .from('chat_participants')
            .select('user_id')
            .eq('room_id', room.room_id);
          
          if (participants && participants.length === 2) {
            const userIds = participants.map(p => p.user_id);
            if (userIds.includes(user.id) && userIds.includes(userId)) {
              console.log("✅ Found existing direct chat");
              setActiveRoom(room.chat_rooms as ChatRoom);
              return;
            }
          }
        }
      }

      // ახალი პირადი ჩატის შექმნა
      const { data: newRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          type: 'direct',
          is_public: false,
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) {
        console.error("❌ Error creating room:", roomError);
        throw roomError;
      }

      // ორივე წევრის დამატება
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { room_id: newRoom.id, user_id: user.id },
          { room_id: newRoom.id, user_id: userId }
        ]);

      if (participantsError) {
        console.error("❌ Error adding participants:", participantsError);
        throw participantsError;
      }

      console.log("✅ Direct chat created successfully");
      setActiveRoom(newRoom as ChatRoom);
      loadRooms();
      toast.success("ჩატი წარმატებით შეიქმნა");
    } catch (error: any) {
      console.error("❌ Error in createDirectChat:", error);
      toast.error("ჩატის შექმნისას შეცდომა დაფიქსირდა");
    }
  };

  // არხში შესვლა
  const joinChannel = async (roomId: string) => {
    if (!user) return;

    console.log("🚪 Joining channel:", roomId);

    try {
      const { error } = await supabase
        .from('chat_participants')
        .insert({
          room_id: roomId,
          user_id: user.id
        });

      if (error) {
        console.error("❌ Error joining channel:", error);
        throw error;
      }

      console.log("✅ Joined channel successfully");
      loadRooms();
      toast.success("არხში წარმატებით შეხვედით");
    } catch (error: any) {
      console.error("❌ Error in joinChannel:", error);
      toast.error("არხში შესვლისას შეცდომა დაფიქსირდა");
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    console.log("🔄 Setting up real-time subscriptions");

    // მესიჯების მოსმენა
    const messageSubscription = supabase
      .channel('chat_messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          console.log("📨 New message received:", payload);
          if (activeRoom && payload.new.room_id === activeRoom.id) {
            loadMessages(activeRoom.id);
          }
        }
      )
      .subscribe();

    // ონლაინ სტატუსის აღნიშვნა
    const updatePresence = async () => {
      try {
        await supabase
          .from('user_presence')
          .upsert({
            user_id: user.id,
            is_online: true,
            last_seen: new Date().toISOString()
          });
      } catch (error) {
        console.error("❌ Error updating presence:", error);
      }
    };

    updatePresence();
    const presenceInterval = setInterval(updatePresence, 30000);

    return () => {
      console.log("🔄 Cleaning up subscriptions");
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
      loading
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
