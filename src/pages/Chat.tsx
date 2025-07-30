
import React, { useState, useEffect } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatProvider, useChat } from '@/context/ChatContext';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageCircle, Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';

const ChatContent = () => {
  const { rooms, setActiveRoom } = useChat();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if there's a room ID in the URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roomId = params.get('room');
    
    if (roomId && rooms.length > 0) {
      const targetRoom = rooms.find(room => room.id === roomId);
      if (targetRoom) {
        setActiveRoom(targetRoom);
      }
    }
  }, [rooms, location.search, setActiveRoom]);

  if (isMobile) {
    return (
      <div className="h-[calc(100vh-134px)] flex flex-col bg-gray-50">
        {/* Mobile Header with Menu Button */}
        <div className="border-b bg-white shadow-sm p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">ჩატები</h1>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="hover:bg-gray-100">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80 bg-gray-50">
              <ChatSidebar />
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Chat Window */}
        <div className="flex-1 min-h-0">
          <ChatWindow />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex bg-gray-50">
      <div className="hidden md:block w-80 border-r border-gray-200 bg-white shadow-sm">
        <ChatSidebar />
      </div>
      <div className="flex-1 min-w-0 bg-white">
        <ChatWindow />
      </div>
    </div>
  );
};

const Chat = () => {
  const { user } = useAuth();

  // Allow non-authenticated users to view public channels

  return (
    <Layout>
      <ChatProvider>
        <ChatContent />
      </ChatProvider>
    </Layout>
  );
};

export default Chat;
