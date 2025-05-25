
import React, { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Hash, User, Users, Loader2 } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export const ChatSidebar = () => {
  const { rooms, activeRoom, setActiveRoom, joinChannel, loading } = useChat();
  const { user } = useAuth();
  const [availableChannels, setAvailableChannels] = React.useState<any[]>([]);

  const channels = rooms.filter(room => room.type === 'channel');
  const directChats = rooms.filter(room => room.type === 'direct');

  // გაღებული არხების ჩატვირთვა
  const loadAvailableChannels = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('type', 'channel')
        .eq('is_public', true);

      if (error) throw error;

      if (data) {
        // ფილტრაცია - მხოლოდ ის არხები რომელშიც არ ვართ
        const joinedRoomIds = rooms.map(room => room.id);
        const available = data.filter(room => !joinedRoomIds.includes(room.id));
        setAvailableChannels(available);
      }
    } catch (error: any) {
      console.error("Error loading available channels:", error);
    }
  };

  const handleJoinChannel = async (roomId: string) => {
    await joinChannel(roomId);
    loadAvailableChannels();
  };

  useEffect(() => {
    loadAvailableChannels();
  }, [rooms, user]);

  return (
    <div className="w-64 border-r bg-gray-50 flex flex-col">
      <div className="p-4 border-b bg-white">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          ჩატები
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Channels */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">არხები</h3>
              </div>
              <div className="space-y-1">
                {channels.map((room) => (
                  <Button
                    key={room.id}
                    variant={activeRoom?.id === room.id ? "default" : "ghost"}
                    className="w-full justify-start h-auto p-2"
                    onClick={() => setActiveRoom(room)}
                  >
                    <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{room.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Available Channels to Join */}
            {availableChannels.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">ხელმისაწვდომი არხები</h3>
                </div>
                <div className="space-y-1">
                  {availableChannels.map((room) => (
                    <Button
                      key={room.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-auto p-2"
                      onClick={() => handleJoinChannel(room.id)}
                    >
                      <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{room.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Messages */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">პირადი მესიჯები</h3>
              </div>
              <div className="space-y-1">
                {directChats.map((room) => (
                  <Button
                    key={room.id}
                    variant={activeRoom?.id === room.id ? "default" : "ghost"}
                    className="w-full justify-start h-auto p-2"
                    onClick={() => setActiveRoom(room)}
                  >
                    <User className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {room.name || 'პირადი ჩატი'}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
