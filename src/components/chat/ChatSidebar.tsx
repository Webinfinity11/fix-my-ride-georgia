
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Hash, User, Circle, Loader2 } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { JoinChannelsButton } from './JoinChannelsButton';

export const ChatSidebar = () => {
  const { rooms, activeRoom, setActiveRoom, onlineUsers, loading } = useChat();
  const { user } = useAuth();

  const channels = rooms.filter(room => room.type === 'channel');
  const directChats = rooms.filter(room => room.type === 'direct');

  const getDirectChatName = (room: any) => {
    if (room.other_participant) {
      return `${room.other_participant.first_name} ${room.other_participant.last_name}`;
    }
    return 'პირადი ჩატი';
  };

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      <div className="p-4 border-b bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-xl text-gray-900">ჩატები</h2>
          <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            <span className="font-medium">{onlineUsers.length}</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Channel Creation Button - Only show for authenticated users */}
          {user && <JoinChannelsButton />}
          
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
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">საჯარო არხები</h3>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                    {channels.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {channels.length === 0 ? (
                    <div className="text-center py-6">
                      <Hash className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">არხები არ მოიძებნა</p>
                    </div>
                  ) : (
                    channels.map((room) => (
                      <Button
                        key={room.id}
                        variant={activeRoom?.id === room.id ? "default" : "ghost"}
                        className={`w-full justify-start h-auto p-3 rounded-lg transition-all ${
                          activeRoom?.id === room.id 
                            ? "bg-primary text-primary-foreground shadow-md" 
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                        onClick={() => setActiveRoom(room)}
                      >
                        <Hash className="h-4 w-4 mr-3 flex-shrink-0" />
                        <div className="flex-1 text-left">
                          <span className="font-medium truncate block">{room.name}</span>
                          {room.description && (
                            <span className="text-xs opacity-75 truncate block">
                              {room.description}
                            </span>
                          )}
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </div>

              {/* Direct Messages - Only show for authenticated users */}
              {user && directChats.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">პირადი მესიჯები</h3>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                      {directChats.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {directChats.map((room) => (
                      <Button
                        key={room.id}
                        variant={activeRoom?.id === room.id ? "default" : "ghost"}
                        className={`w-full justify-start h-auto p-3 rounded-lg transition-all ${
                          activeRoom?.id === room.id 
                            ? "bg-primary text-primary-foreground shadow-md" 
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                        onClick={() => setActiveRoom(room)}
                      >
                        <User className="h-4 w-4 mr-3 flex-shrink-0" />
                        <div className="flex-1 text-left">
                          <span className="font-medium truncate block">
                            {getDirectChatName(room)}
                          </span>
                        </div>
                        {room.other_participant && onlineUsers.includes(room.other_participant.id) && (
                          <Circle className="h-2 w-2 fill-green-500 text-green-500 ml-2" />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
