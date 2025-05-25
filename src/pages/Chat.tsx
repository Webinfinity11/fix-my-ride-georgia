
import React from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

const Chat = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto p-8 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">ჩატისთვის საჭიროა ავტორიზაცია</h2>
            <p className="text-gray-600">
              ჩატის სისტემის გამოსაყენებლად გთხოვთ, გაიაროთ ავტორიზაცია.
            </p>
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
