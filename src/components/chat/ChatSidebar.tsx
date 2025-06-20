
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Hash, User, Circle, Plus } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { CreateChatButton } from './CreateChatButton';
import { JoinChannelsButton } from './JoinChannelsButton';

export const ChatSidebar = () => {
  const { rooms, activeRoom, setActiveRoom, loading } = useChat();
  const { user } = useAuth();

  const channels = rooms.filter(room => room.type === 'channel');
  const directChats = rooms.filter(room => room.type === 'direct');

  const getDirectChatName = (room: any) => {
    if (room.other_participant) {
      return `${room.other_participant.first_name} ${room.other_participant.last_name}`;
    }
    return room.name || 'პირადი ჩატი';
  };

  if (loading) {
    return (
      <Card className="w-80 h-full">
        <div className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-80 h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg mb-3">ჩატები</h2>
        <div className="space-y-2">
          <CreateChatButton />
          <JoinChannelsButton />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Channels Section */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <Hash className="h-4 w-4" />
              <span>არხები ({channels.length})</span>
            </div>
            <div className="space-y-1">
              {channels.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">არხები არ არის</p>
              ) : (
                channels.map((room) => (
                  <Button
                    key={room.id}
                    variant={activeRoom?.id === room.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-left h-auto p-2"
                    onClick={() => setActiveRoom(room)}
                  >
                    <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{room.name || 'უსახელო არხი'}</div>
                      {room.description && (
                        <div className="text-xs text-gray-500 truncate">
                          {room.description}
                        </div>
                      )}
                    </div>
                    {room.unread_count && room.unread_count > 0 && (
                      <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                        {room.unread_count}
                      </div>
                    )}
                  </Button>
                ))
              )}
            </div>
          </div>

          {/* Direct Messages Section */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <User className="h-4 w-4" />
              <span>პირადი მესიჯები ({directChats.length})</span>
            </div>
            <div className="space-y-1">
              {directChats.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">პირადი ჩატები არ არის</p>
              ) : (
                directChats.map((room) => (
                  <Button
                    key={room.id}
                    variant={activeRoom?.id === room.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-left h-auto p-2"
                    onClick={() => setActiveRoom(room)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{getDirectChatName(room)}</div>
                      </div>
                      <Circle className="h-2 w-2 fill-gray-300 text-gray-300 flex-shrink-0" />
                    </div>
                    {room.unread_count && room.unread_count > 0 && (
                      <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                        {room.unread_count}
                      </div>
                    )}
                  </Button>
                ))
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
};
