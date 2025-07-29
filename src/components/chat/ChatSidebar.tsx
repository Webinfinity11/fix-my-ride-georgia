
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Hash, User, Circle, Loader2 } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { JoinChannelsButton } from './JoinChannelsButton';

export const ChatSidebar = () => {
  const { rooms, activeRoom, setActiveRoom, onlineUsers, loading } = useChat();

  const channels = rooms.filter(room => room.type === 'channel');
  const directChats = rooms.filter(room => room.type === 'direct');

  const getDirectChatName = (room: any) => {
    if (room.other_participant) {
      return `${room.other_participant.first_name} ${room.other_participant.last_name}`;
    }
    return 'პირადი ჩატი';
  };

  return (
    <div className="w-64 border-r bg-gray-50 flex flex-col">
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">ჩატები</h2>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            <span>{onlineUsers.length}</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Channel Creation Button */}
          <JoinChannelsButton />
          
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">ჩატვირთვა...</span>
            </div>
          ) : (
            <>
              {/* Channels */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">არხები</h3>
                  <span className="text-xs text-gray-500">({channels.length})</span>
                </div>
                <div className="space-y-1">
                  {channels.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">არხები არ მოიძებნა</p>
                  ) : (
                    channels.map((room) => (
                      <Button
                        key={room.id}
                        variant={activeRoom?.id === room.id ? "default" : "ghost"}
                        className="w-full justify-start h-auto p-2"
                        onClick={() => setActiveRoom(room)}
                      >
                        <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{room.name}</span>
                      </Button>
                    ))
                  )}
                </div>
              </div>

              {/* Direct Messages */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">პირადი მესიჯები</h3>
                  <span className="text-xs text-gray-500">({directChats.length})</span>
                </div>
                <div className="space-y-1">
                  {directChats.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">პირადი ჩატები არ მოიძებნა</p>
                  ) : (
                    directChats.map((room) => (
                      <Button
                        key={room.id}
                        variant={activeRoom?.id === room.id ? "default" : "ghost"}
                        className="w-full justify-start h-auto p-2"
                        onClick={() => setActiveRoom(room)}
                      >
                        <User className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          {getDirectChatName(room)}
                        </span>
                        {room.other_participant && onlineUsers.includes(room.other_participant.id) && (
                          <Circle className="h-2 w-2 fill-green-500 text-green-500 ml-auto" />
                        )}
                      </Button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
