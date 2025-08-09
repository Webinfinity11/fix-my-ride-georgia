
import React, { useState, useEffect } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatProvider, useChat } from '@/context/ChatContext';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageCircle, Menu, ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';

const ChatContent = () => {
  const { rooms, setActiveRoom, activeRoom } = useChat();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);

  // Check if there's a room ID in the URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roomId = params.get('room');
    
    if (roomId && rooms.length > 0) {
      const targetRoom = rooms.find(room => room.id === roomId);
      if (targetRoom) {
        setActiveRoom(targetRoom);
        if (isMobile) {
          setShowChatWindow(true);
        }
      }
    }
  }, [rooms, location.search, setActiveRoom, isMobile]);

  // Handle room selection on mobile
  useEffect(() => {
    if (isMobile && activeRoom) {
      setShowChatWindow(true);
    }
  }, [activeRoom, isMobile]);

  const getChatTitle = () => {
    if (!activeRoom) return '';
    
    if (activeRoom.type === 'channel') {
      return activeRoom.name || 'Channel';
    } else {
      if (activeRoom.other_participant) {
        return `${activeRoom.other_participant.first_name} ${activeRoom.other_participant.last_name}`;
      }
      return 'პირადი ჩატი';
    }
  };

  const handleBackToSidebar = () => {
    setShowChatWindow(false);
    setActiveRoom(null);
  };

  if (isMobile) {
    if (showChatWindow && activeRoom) {
      return (
        <div className="h-[calc(100vh-134px)] flex flex-col bg-gray-50">
          {/* Mobile Chat Header */}
          <div className="border-b bg-white shadow-sm p-4 flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBackToSidebar}
              className="mr-3 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">{getChatTitle()}</h1>
          </div>
          
          {/* Chat Window */}
          <div className="flex-1 min-h-0">
            <ChatWindow />
          </div>
        </div>
      );
    }

    return (
      <div className="h-[calc(100vh-134px)] flex bg-gray-50">
        <div className="w-full bg-white">
          <ChatSidebar />
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
