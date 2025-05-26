
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
  createDirectChat: (userId: string) => Promise<string>;
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

  // Load chat rooms
  const loadRooms = async () => {
    if (!user) return;

    console.log('Loading rooms for user:', user.id);

    try {
      // Get rooms where user is a participant
      const { data: participantRooms, error: participantError } = await supabase
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

      if (participantError) {
        console.error('Error loading participant rooms:', participantError);
        return;
      }

      // Get all public channels that user can join
      const { data: publicRooms, error: publicError } = await supabase
        .from('chat_rooms')
        .select('id, name, type, description, is_public')
        .eq('is_public', true)
        .eq('type', 'channel');

      if (publicError) {
        console.error('Error loading public rooms:', publicError);
        return;
      }

      // Combine participant rooms and public rooms
      const participantRoomIds = participantRooms?.map(p => p.chat_rooms?.id).filter(Boolean) || [];
      const allRooms = [
        ...(participantRooms?.map(p => p.chat_rooms).filter(Boolean) || []),
        ...(publicRooms?.filter(room => !participantRoomIds.includes(room.id)) || [])
      ];

      const roomsData = allRooms.map(room => ({
        id: room.id,
        name: room.name,
        type: room.type as 'direct' | 'channel',
        description: room.description,
        is_public: room.is_public
      }));

      console.log('Loaded rooms:', roomsData);
      setRooms(roomsData);
    } catch (error) {
      console.error('Error in loadRooms:', error);
    }
  };

  // Load messages for a room
  const loadMessages = async (roomId: string) => {
    console.log('Loading messages for room:', roomId);

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
        console.error('Error loading messages:', error);
        return;
      }

      if (data) {
        setMessages(data.map(msg => ({
          ...msg,
          sender_name: `${msg.profiles?.first_name || ''} ${msg.profiles?.last_name || ''}`.trim() || 'Unknown'
        })));
      }
    } catch (error) {
      console.error('Error in loadMessages:', error);
    }
  };

  // Send message
  const sendMessage = async (content: string) => {
    if (!activeRoom || !user || !content.trim()) return;

    console.log('Sending message:', content, 'to room:', activeRoom.id);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: activeRoom.id,
          sender_id: user.id,
          content: content.trim()
        });

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  };

  // Create direct chat
  const createDirectChat = async (userId: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    console.log('Creating direct chat with user:', userId);

    try {
      // Check if direct chat already exists
      const { data: existingParticipants } = await supabase
        .from('chat_participants')
        .select('room_id, chat_rooms!inner(type)')
        .eq('chat_rooms.type', 'direct')
        .in('user_id', [user.id, userId]);

      // Find room where both users are participants
      if (existingParticipants) {
        const roomCounts: { [key: string]: number } = {};
        existingParticipants.forEach(p => {
          roomCounts[p.room_id] = (roomCounts[p.room_id] || 0) + 1;
        });
        
        const existingRoomId = Object.keys(roomCounts).find(roomId => roomCounts[roomId] === 2);
        if (existingRoomId) {
          console.log('Found existing direct chat:', existingRoomId);
          return existingRoomId;
        }
      }

      // Create new direct chat room
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
        console.error('Error creating room:', roomError);
        throw roomError;
      }

      // Add both participants
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert([
          { room_id: newRoom.id, user_id: user.id },
          { room_id: newRoom.id, user_id: userId }
        ]);

      if (participantError) {
        console.error('Error adding participants:', participantError);
        throw participantError;
      }

      console.log('Created new direct chat:', newRoom.id);
      loadRooms(); // Refresh rooms list
      return newRoom.id;

    } catch (error) {
      console.error('Error in createDirectChat:', error);
      throw error;
    }
  };

  // Join channel
  const joinChannel = async (roomId: string) => {
    if (!user) return;

    console.log('Joining channel:', roomId);

    try {
      const { error } = await supabase
        .from('chat_participants')
        .insert({
          room_id: roomId,
          user_id: user.id
        });

      if (error && !error.message.includes('duplicate')) {
        console.error('Error joining channel:', error);
        throw error;
      }

      loadRooms(); // Refresh rooms list
    } catch (error) {
      console.error('Error in joinChannel:', error);
      throw error;
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscriptions');

    // Subscribe to new messages
    const messageSubscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('New message received:', payload.new);
          if (activeRoom && payload.new.room_id === activeRoom.id) {
            loadMessages(activeRoom.id);
          }
        }
      )
      .subscribe();

    // Update presence
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
        console.error('Error updating presence:', error);
      }
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
