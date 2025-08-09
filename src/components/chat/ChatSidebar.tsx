
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Hash, User, Circle, Loader2, Search, Bell } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { JoinChannelsButton } from './JoinChannelsButton';

export const ChatSidebar = () => {
  const { rooms, activeRoom, setActiveRoom, onlineUsers, loading } = useChat();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const channels = rooms.filter(room => room.type === 'channel');
  const directChats = rooms.filter(room => room.type === 'direct');

  const getDirectChatName = (room: any) => {
    if (room.other_participant) {
      return `${room.other_participant.first_name} ${room.other_participant.last_name}`;
    }
    return 'პირადი ჩატი';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const filteredRooms = rooms.filter(room => {
    const name = room.type === 'channel' ? room.name : getDirectChatName(room);
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'group') return room.type === 'channel' && matchesSearch;
    if (activeTab === 'direct') return room.type === 'direct' && matchesSearch;
    
    return matchesSearch;
  });

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Modern Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search for message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 border-0 focus:bg-white focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 border-b border-gray-100">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1">
            <TabsTrigger value="all" className="text-sm">All</TabsTrigger>
            <TabsTrigger value="group" className="text-sm">Group</TabsTrigger>
            <TabsTrigger value="direct" className="text-sm">Direct</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Join Channels Button - Only show for authenticated users */}
      {user && (
        <div className="px-4 py-2">
          <JoinChannelsButton />
        </div>
      )}

      {/* Chat List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Loading...</span>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredRooms.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  {searchQuery ? <Search className="h-8 w-8 mx-auto" /> : <Hash className="h-8 w-8 mx-auto" />}
                </div>
                <p className="text-sm text-gray-500">
                  {searchQuery ? 'No messages found' : 'No conversations yet'}
                </p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isActive = activeRoom?.id === room.id;
                const name = room.type === 'channel' ? room.name : getDirectChatName(room);
                const isOnline = room.type === 'direct' && room.other_participant && onlineUsers.includes(room.other_participant.id);
                
                return (
                  <div
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                      isActive ? 'bg-primary/10 border border-primary/20' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary font-medium">
                            {room.type === 'channel' ? '#' : getInitials(name)}
                          </AvatarFallback>
                        </Avatar>
                        {isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 truncate">{name}</h3>
                          <span className="text-xs text-gray-500">2m</span>
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-0.5">
                          {room.type === 'channel' 
                            ? room.description || 'Public channel'
                            : 'Lorem ipsum dolor, con sectetur adipiscing...'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
