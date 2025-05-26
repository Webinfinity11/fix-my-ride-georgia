
import React, { useEffect } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { Card } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Chat = () => {
  const { user } = useAuth();
  const { rooms, setActiveRoom } = useChat();
  const [searchParams] = useSearchParams();

  // Handle direct room navigation from URL
  useEffect(() => {
    const roomId = searchParams.get('room');
    if (roomId && rooms.length > 0) {
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        console.log('Auto-selecting room from URL:', room);
        setActiveRoom(room);
      }
    }
  }, [roomId, rooms, setActiveRoom]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto p-8 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">ჩატისთვის საჭიროა ავტორიზაცია</h2>
            <p className="text-gray-600 mb-4">
              ჩატის სისტემის გამოსაყენებლად გთხოვთ, გაიაროთ ავტორიზაცია.
            </p>
            <div className="space-y-2">
              <Link to="/login">
                <Button className="w-full">შესვლა</Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" className="w-full">რეგისტრაცია</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="h-[calc(100vh-64px)] flex">
        <div className="hidden md:block">
          <ChatSidebar />
        </div>
        <div className="flex-1">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
};

export default Chat;
