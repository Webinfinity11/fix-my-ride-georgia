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
  created_by?: string | null;
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
  loading: boolean;
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
  const [loading, setLoading] = useState(false);

  // Load rooms function - განახლებული ყველა ავტორიზებული მომხმარებლისთვის
  const loadRooms = async () => {
    if (!user) {
      console.log('No user found, skipping room loading');
      return;
    }

    setLoading(true);
    console.log('🏠 Loading rooms for user:', user.id);

    try {
      // Get user's participations first
      const { data: userParticipations, error: participationError } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user.id);

      if (participationError) {
        console.error('❌ Error loading user participations:', participationError);
        toast.error('მონაწილეობების ჩატვირთვისას შეცდომა დაფიქსირდა');
        return;
      }

      const roomIds = userParticipations?.map(p => p.room_id) || [];

      // Get public rooms, user's private rooms, and rooms created by user
      const { data: allRooms, error } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          name,
          type,
          description,
          is_public,
          created_by
        `)
        .or(`is_public.eq.true,id.in.(${roomIds.length > 0 ? roomIds.join(',') : 'null'}),created_by.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading rooms:', error);
        toast.error('ჩატების ჩატვირთვისას შეცდომა დაფიქსირდა');
        return;
      }

      if (!allRooms) {
        setRooms([]);
        return;
      }

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
            created_by: room.created_by,
            other_participant: otherParticipant
          };
        })
      );
      
      console.log('🏠 Processed rooms:', roomsWithParticipants);
      setRooms(roomsWithParticipants);
    } catch (error) {
      console.error('❌ Error in loadRooms:', error);
      toast.error('ჩატების ჩატვირთვისას შეცდომა დაფიქსირდა');
    } finally {
      setLoading(false);
    }
  };

  // Load messages function
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
        toast.error('მესიჯების ჩატვირთვისას შეცდომა დაფიქსირდა');
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
      toast.error('მესიჯების ჩატვირთვისას შეცდომა დაფიქსირდა');
    }
  };

  // Send message function
  const sendMessage = async (content: string, fileUrl?: string, fileType?: 'image' | 'video' | 'file', fileName?: string) => {
    if (!activeRoom || !user) {
      toast.error('მესიჯის გაგზავნა შეუძლებელია');
      return;
    }

    console.log('📤 Sending message:', { content, room: activeRoom.id, user: user.id, fileUrl, fileType, fileName });

    try {
      // First ensure the user is a participant in the room
      const { data: participation } = await supabase
        .from('chat_participants')
        .select('id')
        .eq('room_id', activeRoom.id)
        .eq('user_id', user.id)
        .single();

      if (!participation) {
        // Add user as participant if not already
        const { error: participantError } = await supabase
          .from('chat_participants')
          .insert({
            room_id: activeRoom.id,
            user_id: user.id
          });

        if (participantError) {
          console.error('❌ Error adding participant:', participantError);
          toast.error('ჩატში შესვლისას შეცდომა დაფიქსირდა');
          return;
        }
      }

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
        toast.error('მესიჯის გაგზავნისას შეცდომა დაფიქსირდა');
      } else {
        console.log('✅ Message sent successfully');
      }
    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      toast.error('მესიჯის გაგზავნისას შეცდომა დაფიქსირდა');
    }
  };

  // Create direct chat function
  const createDirectChat = async (userId: string): Promise<ChatRoom | null> => {
    if (!user) {
      toast.error('ავტორიზაცია საჭიროა');
      return null;
    }

    console.log('🔄 Creating direct chat between:', user.id, 'and', userId);

    try {
      // Check for existing direct chat between these users
      const { data: existingChats } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          name,
          type,
          description,
          is_public,
          created_by,
          chat_participants!inner(user_id)
        `)
        .eq('type', 'direct');

      if (existingChats) {
        // Find a direct chat where both users are participants
        for (const chat of existingChats) {
          const participantIds = chat.chat_participants.map((p: any) => p.user_id);
          if (participantIds.includes(user.id) && participantIds.includes(userId) && participantIds.length === 2) {
            console.log('✅ Found existing direct chat:', chat.id);
            await loadRooms();
            return {
              id: chat.id,
              name: chat.name,
              type: 'direct',
              description: chat.description,
              is_public: chat.is_public,
              created_by: chat.created_by,
              other_participant: null
            };
          }
        }
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
        toast.error('ჩატის შექმნისას შეცდომა დაფიქსირდა');
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
        toast.error('მონაწილეების დამატებისას შეცდომა დაფიქსირდა');
        return null;
      }

      await loadRooms();
      toast.success('პირადი ჩატი წარმატებით შეიქმნა');
      
      return {
        id: newRoom.id,
        name: newRoom.name,
        type: 'direct',
        description: newRoom.description,
        is_public: newRoom.is_public,
        created_by: newRoom.created_by,
        other_participant: null
      };
    } catch (error) {
      console.error('❌ Error in createDirectChat:', error);
      toast.error('პირადი ჩატის შექმნისას შეცდომა დაფიქსირდა');
      return null;
    }
  };

  // Create channel function
  const createChannel = async (name: string, description?: string, isPublic: boolean = true): Promise<ChatRoom | null> => {
    if (!user) {
      toast.error('ავტორიზაცია საჭიროა');
      return null;
    }

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
        toast.error('არხის შექმნისას შეცდომა დაფიქსირდა');
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
        toast.error('მონაწილის დამატებისას შეცდომა დაფიქსირდა');
      }

      await loadRooms();
      toast.success('არხი წარმატებით შეიქმნა');
      
      return {
        id: newRoom.id,
        name: newRoom.name,
        type: 'channel',
        description: newRoom.description,
        is_public: newRoom.is_public,
        created_by: newRoom.created_by,
        other_participant: null
      };
    } catch (error) {
      console.error('❌ Error in createChannel:', error);
      toast.error('არხის შექმნისას შეცდომა დაფიქსირდა');
      return null;
    }
  };

  // Join channel function
  const joinChannel = async (roomId: string) => {
    if (!user) {
      toast.error('ავტორიზაცია საჭიროა');
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_participants')
        .insert({
          room_id: roomId,
          user_id: user.id
        });

      if (!error) {
        await loadRooms();
        toast.success('არხში წარმატებით შეგიტანდით');
      } else {
        console.error('❌ Error joining channel:', error);
        toast.error('არხში შესვლისას შეცდომა დაფიქსირდა');
      }
    } catch (error) {
      console.error('❌ Error in joinChannel:', error);
      toast.error('არხში შესვლისას შეცდომა დაფიქსირდა');
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscriptions for user:', user.id);

    // Message real-time listener
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

    // User presence real-time listener
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

    // Update presence
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
    } else {
      setMessages([]);
    }
  }, [activeRoom]);

  return (
    <ChatContext.Provider value={{
      rooms,
      activeRoom,
      messages,
      onlineUsers,
      loading,
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
