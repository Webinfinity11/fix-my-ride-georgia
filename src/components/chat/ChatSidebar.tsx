
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Hash, User } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

export const ChatSidebar = () => {
  const { rooms, activeRoom, setActiveRoom } = useChat();

  const channels = rooms.filter(room => room.type === 'channel');
  const directChats = rooms.filter(room => room.type === 'direct');

  return (
    <div className="w-64 border-r bg-gray-50 flex flex-col">
      <div className="p-4 border-b bg-white">
        <h2 className="font-semibold text-lg">ჩატები</h2>
      </div>

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
    </div>
  );
};
