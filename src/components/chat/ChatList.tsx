
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hash, User, Users } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { GroupChatCreator } from './GroupChatCreator';

export const ChatList = () => {
  const { rooms, activeRoom, setActiveRoom } = useChat();

  const channels = rooms.filter(room => room.type === 'channel');
  const directChats = rooms.filter(room => room.type === 'direct');

  return (
    <div className="w-64 border-r bg-gray-50 flex flex-col h-full">
      <div className="p-4 border-b bg-white">
        <h2 className="font-semibold text-lg">ჩატები</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Group Creation */}
          <GroupChatCreator />
          
          {/* Channels */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Hash className="h-4 w-4" />
                არხები ({channels.length})
              </h3>
            </div>
            <div className="space-y-1">
              {channels.map((room) => (
                <Button
                  key={room.id}
                  variant={activeRoom?.id === room.id ? "default" : "ghost"}
                  className="w-full justify-start h-auto p-2 text-left"
                  onClick={() => setActiveRoom(room)}
                >
                  <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{room.name}</div>
                    {room.unread_count && room.unread_count > 0 && (
                      <Badge variant="destructive" className="text-xs ml-2">
                        {room.unread_count}
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
              {channels.length === 0 && (
                <div className="text-sm text-gray-500 italic p-2">
                  არხები არ არის
                </div>
              )}
            </div>
          </div>

          {/* Direct Messages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <User className="h-4 w-4" />
                პირადი მესიჯები ({directChats.length})
              </h3>
            </div>
            <div className="space-y-1">
              {directChats.map((room) => (
                <Button
                  key={room.id}
                  variant={activeRoom?.id === room.id ? "default" : "ghost"}
                  className="w-full justify-start h-auto p-2 text-left"
                  onClick={() => setActiveRoom(room)}
                >
                  <User className="h-4 w-4 mr-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">
                      {room.name || 'პირადი ჩატი'}
                    </div>
                    {room.unread_count && room.unread_count > 0 && (
                      <Badge variant="destructive" className="text-xs ml-2">
                        {room.unread_count}
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
              {directChats.length === 0 && (
                <div className="text-sm text-gray-500 italic p-2">
                  პირადი ჩატები არ არის
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
